struct Params {
  resolution: vec2f,
  pointer: vec2f,
  time: f32,
  strength: f32,
  radiusX: f32,
  radiusY: f32,
  coreRadius: f32,
  bandPosition: f32,
  bandWidth: f32,
  outerFalloff: f32,
  direction: f32,
  shearStrength: f32,
  projectAspect: f32,
  debugField: f32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var projectImage: texture_2d<f32>;

fn softBand(value: f32, width: f32) -> f32 {
  return exp(-abs(value) / width);
}

fn diagnosticGrid(uv: vec2f, resolution: vec2f) -> f32 {
  let responsiveSpacing = clamp(min(resolution.x, resolution.y) * 0.095, 60.0, 100.0);
  let gridPosition = uv * resolution / responsiveSpacing;
  let distanceToLine = min(abs(fract(gridPosition) - 0.5), vec2f(0.5));
  let lineWidth = max(fwidth(gridPosition), vec2f(0.0001)) * 0.55;
  let vertical = 1.0 - smoothstep(lineWidth.x, lineWidth.x * 2.0, distanceToLine.x);
  let horizontal = 1.0 - smoothstep(lineWidth.y, lineWidth.y * 2.0, distanceToLine.y);
  return max(vertical, horizontal);
}

fn projectSample(layoutUv: vec2f, sampleUv: vec2f, resolution: vec2f) -> vec4f {
  let viewportAspect = resolution.x / resolution.y;
  let isPortrait = select(0.0, 1.0, viewportAspect < 0.86);
  let maxWidth = mix(480.0, resolution.x * 0.78, isPortrait);
  let widthPx = min(clamp(resolution.x * 0.32, 320.0, 480.0), maxWidth);
  let heightPx = widthPx / params.projectAspect;
  let size = vec2f(widthPx / resolution.x, heightPx / resolution.y);
  let center = mix(vec2f(0.74, 0.72), vec2f(0.5, 0.79), isPortrait);
  let origin = center - size * 0.5;
  let layoutLocalUv = (layoutUv - origin) / size;
  let sampleLocalUv = (sampleUv - origin) / size;
  let inside = step(vec2f(0.0), layoutLocalUv) * step(layoutLocalUv, vec2f(1.0));
  let mask = inside.x * inside.y;
  let textureSize = vec2f(textureDimensions(projectImage));
  let texel = vec2i(clamp(sampleLocalUv, vec2f(0.0), vec2f(0.9999)) * textureSize);
  let sampled = textureLoad(projectImage, texel, 0);
  return vec4f(sampled.rgb, mask);
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let safeResolution = max(params.resolution, vec2f(1.0));
  let aspect = safeResolution.x / safeResolution.y;
  let pixelPosition = uv * safeResolution;
  let pointerPosition = params.pointer * safeResolution;
  let deltaPixels = pixelPosition - pointerPosition;
  let safeRadii = max(vec2f(params.radiusX, params.radiusY), vec2f(1.0));
  let lensDistance = length(deltaPixels / safeRadii);

  // A stable center opens into a smooth annular refraction band, then fades away.
  let coreGate = smoothstep(params.coreRadius, params.bandPosition, lensDistance);
  let bandDelta = (lensDistance - params.bandPosition) / max(params.bandWidth, 0.001);
  let lensBand = exp(-0.5 * bandDelta * bandDelta);
  let outerEnvelope = 1.0 - smoothstep(1.0, 1.0 + params.outerFalloff, lensDistance);
  let lensProfile = coreGate * lensBand * outerEnvelope;

  let radialDirection = normalize(deltaPixels + vec2f(0.0001));
  let bendPixels = lensProfile * params.strength * min(safeRadii.x, safeRadii.y);
  // 中文调节说明：direction = -1 时，采样向外偏移，视觉内容向不可见中心内弯；+1 反向外推。
  let radialOffset = radialDirection * bendPixels * -params.direction;
  let shearOffset = vec2f(bendPixels * params.shearStrength, 0.0);
  let bentUv = (pixelPosition + radialOffset + shearOffset) / safeResolution;
  var bentPosition = bentUv - vec2f(0.5);
  bentPosition.x *= aspect;

  let drift = sin(params.time * 0.085) * 0.012;
  let fieldA = softBand(bentPosition.y + bentPosition.x * 0.16 + drift, 0.034);
  let fieldB = softBand(bentPosition.y - bentPosition.x * 0.09 - 0.19, 0.022);
  let fieldC = softBand(bentPosition.y + bentPosition.x * 0.045 + 0.24, 0.052);

  let graphite = vec3f(0.003, 0.004, 0.007);
  let coldBlue = vec3f(0.07, 0.105, 0.17);
  let coldWhite = vec3f(0.34, 0.38, 0.46);
  let field = fieldA * 0.19 + fieldB * 0.09 + fieldC * 0.06;
  let color = mix(graphite, coldBlue, clamp(field, 0.0, 0.22));
  let highlight = pow(max(fieldA, 0.0), 2.0) * 0.025;
  let grid = diagnosticGrid(bentUv, safeResolution);
  let project = projectSample(uv, bentUv, safeResolution);
  var diagnosticColor = color + coldWhite * highlight;
  diagnosticColor = mix(diagnosticColor, vec3f(0.32), grid * 0.075);
  diagnosticColor = mix(diagnosticColor, project.rgb, project.a);

  if (params.debugField > 0.5) {
    let coreDiagnostic = 1.0 - smoothstep(params.coreRadius * 0.72, params.coreRadius, lensDistance);
    let outerDiagnostic = outerEnvelope * (1.0 - lensBand);
    diagnosticColor = mix(diagnosticColor, vec3f(0.12), coreDiagnostic * 0.1);
    diagnosticColor = mix(diagnosticColor, vec3f(0.12, 0.17, 0.24), lensBand * 0.14);
    diagnosticColor = mix(diagnosticColor, vec3f(0.1, 0.08, 0.14), outerDiagnostic * 0.08);
  }

  return vec4f(diagnosticColor, 1.0);
}
