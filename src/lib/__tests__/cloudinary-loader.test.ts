import { describe, expect, it } from "vitest";
import cloudinaryLoader from "../cloudinary-loader";
import { MEDIA_MAX_WIDTH } from "../../storage/cloudinary-urls";
import { LOADER_MAX_WIDTH } from "../cloudinary-loader";

const SRC = "https://res.cloudinary.com/example-cloud/image/upload/f_auto,q_auto,c_limit,w_1600/media/abc";

describe("cloudinaryLoader", () => {
  it("asks Cloudinary for the requested width with f_auto,q_auto", () => {
    expect(cloudinaryLoader({ src: SRC, width: 640 })).toBe("https://res.cloudinary.com/example-cloud/image/upload/f_auto,q_auto,c_limit,w_640/media/abc");
  });

  it("caps the width", () => {
    expect(cloudinaryLoader({ src: SRC, width: 3840 })).toContain(`c_limit,w_${LOADER_MAX_WIDTH}/media/abc`);
    expect(LOADER_MAX_WIDTH).toBe(MEDIA_MAX_WIDTH);
  });

  it("works on a bare delivery URL and honours an explicit quality", () => {
    const bare = "https://res.cloudinary.com/example-cloud/image/upload/media/abc";
    expect(cloudinaryLoader({ src: bare, width: 360, quality: 60 })).toBe("https://res.cloudinary.com/example-cloud/image/upload/f_auto,q_60,c_limit,w_360/media/abc");
  });

  it("does not touch local images, apart from recording the width", () => {
    expect(cloudinaryLoader({ src: "/logo-horizontal.svg", width: 256 })).toBe("/logo-horizontal.svg?w=256");
  });
});
