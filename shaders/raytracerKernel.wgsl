// texture storage
@group(0) @binding(0) var colorBuffer : texture_storage_2d<rgba8unorm, write>

// number of pixels this function is going to handle
@compute @workgroup_size(1,1,1)

//global_invocation_id ==> cooridnat of pthe pixel we are working on 
fn main(@builtin(global_invocation_id) GlobalInvocationId vec3<u32>)
{
    let screenPos: vec2<i32> = vec2<i32>(i32(GlobalInvocationId.x), i32(GlobalInvocationId.y));
    let pixelColor = vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
    textureStore(colorBuffer, screenPos, vec4<f32>(pixelColor, 1.0));
}