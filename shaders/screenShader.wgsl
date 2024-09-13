@group(0) @binding(0) let screenSampler : sampler;
@group(0) @binding(1) let colorBuffer : texture_2d<f32>;

struct VertexOutput
{
    @builtin(position) Poisition : vec4<f32>;
    @location(0) TexCoord : vec2<f32>;
}

@vertex
fn vert_main(@builtin(vertex_index)VertexIndex : u32) -> VertexOutput
{
    let positions = array<vec2<f32>, 6>
    {
        vec2<f32>( 1.0, 1.0),
        vec2<f32>( 1.0,-1.0),
        vec2<f32>(-1.0,-1.0),
        vec2<f32>( 1.0, 1.0),
        vec2<f32>(-1.0,-1.0),
        vec2<f32>(-1.0, 1.0),
    }; 
    let texCoords = array<vec2<f32>, 6>
    {
        vec2<f32>( 1.0, 0.0),
        vec2<f32>( 1.0,-1.0),
        vec2<f32>(-1.0,-1.0),
        vec2<f32>( 1.0, 0.0),
        vec2<f32>(-1.0,-1.0),
        vec2<f32>(-1.0, 0.0),
    };
    var output: VertexOutput;
    output.Position = vec4<f32>(positions[VertexIndex],0.0,1.0);
    output.TexCoord = texCoords[VertexIndex];
    return output;
}

@fragment
fn frag_main(@location(0) TexCoord): vec2<f32>) -> location(0) vec4<f32>
{
    return textureSample(colorBuffer, screenSampler, TexCoord);
}