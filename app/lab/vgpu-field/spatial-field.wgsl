struct Params {
  resolution: vec2f,
  pointer: vec2f,
  time: f32,
  strength: f32,
}

@group(0) @binding(0) var<uniform> params: Params;

fn softBand(value: f32, width: f32) -> f32 {
  return exp(-abs(value) / width);
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let safeResolution = max(params.resolution, vec2f(1.0));
  let aspect = safeResolution.x / safeResolution.y;
  var position = uv - vec2f(0.5);
  position.x *= aspect;

  var pointer = params.pointer - vec2f(0.5);
  pointer.x *= aspect;

  let delta = position - pointer;
  let ellipticalDistance = length(delta * vec2f(0.78, 1.18));
  let influence = exp(-ellipticalDistance * 4.2);
  let directionalForce = normalize(delta + vec2f(0.0001)) * influence * params.strength;

  // A directional shear reads as local spatial pressure rather than a circular ripple.
  let warped = position - directionalForce * vec2f(0.72, 0.28);
  let drift = sin(params.time * 0.085) * 0.012;
  let fieldA = softBand(warped.y + warped.x * 0.16 + drift, 0.034);
  let fieldB = softBand(warped.y - warped.x * 0.09 - 0.19, 0.022);
  let fieldC = softBand(warped.y + warped.x * 0.045 + 0.24, 0.052);
  let localCompression = influence * (0.18 + 0.12 * dot(normalize(delta + vec2f(0.001)), vec2f(0.92, 0.38)));

  let graphite = vec3f(0.003, 0.004, 0.007);
  let coldBlue = vec3f(0.07, 0.105, 0.17);
  let coldWhite = vec3f(0.34, 0.38, 0.46);
  let field = fieldA * 0.19 + fieldB * 0.09 + fieldC * 0.06 + localCompression * 0.12;
  let color = mix(graphite, coldBlue, clamp(field, 0.0, 0.22));
  let highlight = pow(max(fieldA * influence, 0.0), 2.0) * 0.025;

  return vec4f(color + coldWhite * highlight, 1.0);
}
