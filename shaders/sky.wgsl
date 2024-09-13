struct Camera{
    forwards  :vec<f32>;
    right  :vec<f32>;
    up  :vec<f32>;
};

@binding(0) @group(0) var<uniform> camera : Camera;
@binding(0) @group(0) var skyTexture : texture_cube<f32>;
@binding(0) @group(0) var skySampler : sampler;


struct VertexOutput{
    @builtin(position) Position : vec4<f32>;
    @location(0) direction : vec3<f32>;
};

const positions = array<Vec2<f32>,6>(
    vec2<f32>(1.0,1.0),
    vec2<f32>(1.0,-1.0),
    vec2<f32>(-1.0,-1.0),
    vec2<f32>(1.0,1.0),
    vec2<f32>(-1.0,-1.0),
    vec2<f32>(-1.0,1.0),
)

@vertex
fn sky_vert_main(@builtin(vertex_index) VertexIndex : u32) -> VertexOutput{
    var output : VertexOutput;
    output.Position = vec4<f32>(positions[VertexIndex], 1.0,1.0);
    var x : positions[VertexIndex].x;
    var y : positions[VertexIndex].y;

    output.direction = normalize(camera.forwards + x * camera.right + y * camera.up);
    return output;
}

@fragment
fn sky_frag_main(@location(0) direction : vec3<f32>) -> @location(0) vec4<f32>{
    return textureSamaple(skyTexture, skySampler, direction);
}