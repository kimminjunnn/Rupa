import axios from "axios";

import { VisionClientService } from "./vision-client.service";

describe("VisionClientService", () => {
  afterEach(() => {
    delete process.env.VISION_SERVICE_TIMEOUT_MS;
    jest.restoreAllMocks();
  });

  it("uses a 60 second default timeout for wall analysis", () => {
    const create = jest.spyOn(axios, "create").mockReturnValue({ post: jest.fn() } as never);

    new VisionClientService();

    expect(create).toHaveBeenCalledWith({
      baseURL: "http://localhost:8000",
      timeout: 60000,
    });
  });

  it("allows the vision service timeout to be configured", () => {
    process.env.VISION_SERVICE_TIMEOUT_MS = "45000";
    const create = jest.spyOn(axios, "create").mockReturnValue({ post: jest.fn() } as never);

    new VisionClientService();

    expect(create).toHaveBeenCalledWith({
      baseURL: "http://localhost:8000",
      timeout: 45000,
    });
  });

  it("posts wall images to the vision service as multipart form data", async () => {
    let body: unknown;
    const post = jest.fn().mockImplementation(async (_path: string, data: unknown) => {
      body = data;
      return {
        data: {
          image: { width: 100, height: 80 },
          objects: [],
        },
      };
    });
    jest.spyOn(axios, "create").mockReturnValue({ post } as never);
    const service = new VisionClientService();

    await service.analyzeWall({
      filename: "wall.jpg",
      mimetype: "image/jpeg",
      buffer: Buffer.from("wall"),
    });

    expect(post).toHaveBeenCalledWith("/internal/analyze-wall", expect.any(FormData));
    expect(body).toBeInstanceOf(FormData);
    const file = (body as FormData).get("file");
    expect(file).toBeInstanceOf(File);
    expect((file as File).name).toBe("wall.jpg");
    expect((file as File).type).toBe("image/jpeg");
    expect(await (file as File).text()).toBe("wall");
  });

  it("logs wall analysis timeout context before returning a gateway timeout", async () => {
    const timeoutError = Object.assign(new Error("timeout"), { code: "ECONNABORTED" });
    const post = jest.fn().mockRejectedValue(timeoutError);
    jest.spyOn(axios, "create").mockReturnValue({ post } as never);
    const error = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const service = new VisionClientService();

    await expect(
      service.analyzeWall({
        filename: "busy-wall.jpg",
        mimetype: "image/jpeg",
        buffer: Buffer.from("wall"),
      }),
    ).rejects.toThrow("벽 분석 시간이 초과되었습니다.");

    expect(error).toHaveBeenCalledWith("vision_wall_analysis_timeout", {
      filename: "busy-wall.jpg",
      mimetype: "image/jpeg",
      bytes: 4,
      timeoutMs: 60000,
      elapsedMs: expect.any(Number),
    });
  });
});
