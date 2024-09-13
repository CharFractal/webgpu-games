// texture storage
@group(0) @binding(0) var colorBuffer : texture_storage_2d<rgba8unorm, write>;

struct Sphere{
    center: vec3<f32>,
    radius: f32,
};

struct Ray{
    direction: vec3<f32>,
    origin: vec3<f32>,
};

// number of pixels this function is going to handle
@compute @workgroup_size(1,1,1)
//global_invocation_id ==> cooridnat of pthe pixel we are working on 
fn main(@builtin(global_invocation_id) GlobalInvocationId: vec3<u32>)
{
    let screenSize: vec2<i32> = vec2<i32>(textureDimensions(colorBuffer)); 
    let screenPos: vec2<i32> = vec2<i32>(i32(GlobalInvocationId.x), i32(GlobalInvocationId.y));
    // how far each of these poistions are across the screen
    let horizontalCoeficient : f32 = (f32(screenPos.x) - f32(screenSize.x) / 2) /f32(screenSize.x);
    let verticalCoeficient : f32 = (f32(screenPos.y) - f32(screenSize.y) / 2) /f32(screenSize.x);
    let forwards : vec3<f32> = vec3<f32>(1.0,0.0,0.0);
    let right : vec3<f32> = vec3<f32>(0.0,-1.0,0.0);
    let up : vec3<f32> = vec3<f32>(0.0,0.0,1.0);

    var mySphere : Sphere;
    mySphere.center = vec3<f32>(3.0,0.0,0.0);
    mySphere.radius = 1.0;
    
    var myRay: Ray;
    myRay.direction = normalize(forwards + horizontalCoeficient * right + verticalCoeficient * up);

    var pixelColor: vec3<f32> = vec3<f32>(0.0, 0.0, 1.0);
    if(hit(myRay, mySphere)){
        pixelColor = vec3<f32>(1.0, 1.0, 0.0);
    }
    textureStore(colorBuffer, screenPos, vec4<f32>(pixelColor, 1.0));
}

fn hit(ray : Ray, sphere : Sphere) -> bool{
    let a : f32 = dot(ray.direction, ray.direction);
    let b : f32 = dot(ray.direction, ray.origin - sphere.center) * 2.0;
    let c : f32 = dot(ray.origin - sphere.center, ray.origin - sphere.center) - (sphere.radius * sphere.radius);
    let d : f32 = b * b - 4 * a * c;
    return d > 0;
}