struct Params {
  resolution: vec2f,
  pointer: vec2f,
  videoSize: vec2f,
  texturePosition: vec2f,
  strength: f32,
  radiusX: f32,
  radiusY: f32,
  coreRadius: f32,
  bandPosition: f32,
  bandWidth: f32,
  outerFalloff: f32,
  direction: f32,
  shearStrength: f32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var heroVideo: texture_2d<f32>;
@group(0) @binding(2) var heroSampler: sampler;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let safeResolution = max(params.resolution, vec2f(1.0));
  let safeVideoSize = max(params.videoSize, vec2f(1.0));
  let pixelPosition = uv * safeResolution;
  let pointerPosition = params.pointer * safeResolution;
  let deltaPixels = pixelPosition - pointerPosition;
  let safeRadii = max(vec2f(params.radiusX, params.radiusY), vec2f(1.0));
  let lensDistance = length(deltaPixels / safeRadii);

  let coreGate = smoothstep(params.coreRadius, params.bandPosition, lensDistance);
  let bandDelta = (lensDistance - params.bandPosition) / max(params.bandWidth, 0.001);
  let lensBand = exp(-0.5 * bandDelta * bandDelta);
  let outerEnvelope = 1.0 - smoothstep(1.0, 1.0 + params.outerFalloff, lensDistance);
  let lensProfile = coreGate * lensBand * outerEnvelope;

  let radialDirection = normalize(deltaPixels + vec2f(0.0001));
  let bendPixels = lensProfile * params.strength * min(safeRadii.x, safeRadii.y);
  // direction = -1 samples outward so the visible light path bends inward.
  let radialOffset = radialDirection * bendPixels * -params.direction;
  let shearOffset = vec2f(bendPixels * params.shearStrength, 0.0);
  let bentPixel = pixelPosition + radialOffset + shearOffset;

  // CSS background-size: cover with a parameterized focal point.
  let coverScale = max(
    safeResolution.x / safeVideoSize.x,
    safeResolution.y / safeVideoSize.y,
  );
  let coveredSize = safeVideoSize * coverScale;
  let coverUv = (bentPixel - safeResolution * 0.5) / coveredSize + params.texturePosition;
  let color = textureSampleLevel(heroVideo, heroSampler, clamp(coverUv, vec2f(0.0), vec2f(1.0)), 0.0);

  return vec4f(color.rgb, 1.0);
}
