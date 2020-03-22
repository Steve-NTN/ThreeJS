import {
    AmbientLight,
    Color,
    CubeRefractionMapping,
    DoubleSide, FrontSide, BackSide,
    Float32BufferAttribute,
    Mesh,
    MeshPhysicalMaterial,
    NearestFilter,
    PerspectiveCamera,
    PointLight,
    RepeatWrapping,
    RGBFormat,
    Scene,
    TextureLoader,
    TorusKnotBufferGeometry,
    WebGLRenderer,
} from "./Opensource/three.module.js";
import { OrbitControls } from "./Opensource/OrbitControls.js";
import { GLTFLoader } from "./Opensource/GLTFLoader.js";
import { GUI } from './Opensource/dat.gui.module.js';

var constants = {

    side: {

        'THREE.FrontSide': FrontSide,
        'THREE.BackSide': BackSide,
        'THREE.DoubleSide': DoubleSide

    },

};

function getObjectsKeys(obj) {
    var keys = [];
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            keys.push(key);
        }

    }
    return keys;
}

var textureLoader = new TextureLoader();

var diffuseMaps = (function () {

    var bricks = textureLoader.load('./Photo/brick_diffuse.jpg');
    bricks.wrapS = RepeatWrapping;
    bricks.wrapT = RepeatWrapping;
    bricks.repeat.set(9, 1);

    var wood_grain = textureLoader.load('./Photo/wood.jpg');
    wood_grain.wrapS = RepeatWrapping;
    wood_grain.wrapT = RepeatWrapping;
    wood_grain.repeat.set(9, 1);
    return {
        none: null,
        bricks: bricks,
        wood_grain: wood_grain,
    };

})();

var roughnessMaps = (function () {

    var bricks = textureLoader.load('./Photo/brick_roughness.jpg');
    bricks.wrapT = RepeatWrapping;
    bricks.wrapS = RepeatWrapping;
    bricks.repeat.set(9, 1);

    return {
        none: null,
        bricks: bricks
    };

})();

var alphaMaps = (function () {

    var fibers = textureLoader.load('./Photo/alphaMap.jpg');
    fibers.wrapT = RepeatWrapping;
    fibers.wrapS = RepeatWrapping;
    fibers.repeat.set(9, 1);

    return {
        none: null,
        fibers: fibers
    };

})();


var metalnessMaps = (function () {


    return {
        none: null,
    };

})();
var diffuseMapKeys = getObjectsKeys(diffuseMaps);
var roughnessMapKeys = getObjectsKeys(roughnessMaps);
var alphaMapKeys = getObjectsKeys(alphaMaps);
var metalnessMapKeys = getObjectsKeys(metalnessMaps);

function generateVertexColors(geometry) {

    var positionAttribute = geometry.attributes.position;

    var colors = [];
    var color = new Color();

    for (var i = 0, il = positionAttribute.count; i < il; i++) {

        color.setHSL(i / il * Math.random(), 0.5, 0.5);
        colors.push(color.r, color.g, color.b);

    }

    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));

}

function handleColorChange(color) {

    return function (value) {

        if (typeof value === 'string') {

            value = value.replace('#', '0x');

        }

        color.setHex(value);

    };

}

function needsUpdate(material, geometry) {

    return function () {

        material.vertexColors = material.vertexColors;
        material.side = parseInt(material.side); //Ensure number
        material.needsUpdate = true;
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.normal.needsUpdate = true;
        geometry.attributes.color.needsUpdate = true;

    };

}

function updateTexture(material, materialKey, textures) {

    return function (key) {
        material[materialKey] = textures[key];

        material.needsUpdate = true;

    };

}

function guiScene(gui, scene) {

    var folder = gui.addFolder('Scene');

    var data = {
        background: '#000000',
        'ambient light': ambientLight.color.getHex()
    };

    folder.addColor(data, 'ambient light').onChange(handleColorChange(ambientLight.color));


}

function guiMaterial(gui, mesh, material, geometry) {

    var folder = gui.addFolder('THREE.Material');

    folder.add(material, 'transparent');
    folder.add(material, 'opacity', 0, 1).step(0.01);
    folder.add(material, 'depthTest');
    folder.add(material, 'depthWrite');
    folder.add(material, 'alphaTest', 0, 1).step(0.01).onChange(needsUpdate(material, geometry));
    folder.add(material, 'visible');
    folder.add(material, 'side', constants.side).onChange(needsUpdate(material, geometry));

}

function guiMeshPhysicalMaterial(gui, mesh, material, geometry) {

    var data = {
        color: material.color.getHex(),
        emissive: material.emissive.getHex(),
        map: diffuseMapKeys[0],
        roughnessMap: roughnessMapKeys[0],
        alphaMap: alphaMapKeys[0],
        metalnessMap: metalnessMapKeys[0],
    };

    var folder = gui.addFolder('THREE.MeshPhysicalMaterial');

    folder.addColor(data, 'color').onChange(handleColorChange(material.color));
    folder.addColor(data, 'emissive').onChange(handleColorChange(material.emissive));

    folder.add(material, 'roughness', 0, 1);
    folder.add(material, 'metalness', 0, 1);
    folder.add(material, 'reflectivity', 0, 1);
    folder.add(material, 'clearcoat', 0, 1).step(0.01);
    folder.add(material, 'clearcoatRoughness', 0, 1).step(0.01);
    folder.add(material, 'flatShading').onChange(needsUpdate(material, geometry));
    folder.add(material, 'wireframe');
    folder.add(material, 'wireframeLinewidth', 0, 10);
    folder.add(material, 'vertexColors').onChange(needsUpdate(material, geometry));
    folder.add(data, 'map', diffuseMapKeys).onChange(updateTexture(material, 'map', diffuseMaps));
    folder.add(data, 'roughnessMap', roughnessMapKeys).onChange(updateTexture(material, 'roughnessMap', roughnessMaps));
    folder.add(data, 'alphaMap', alphaMapKeys).onChange(updateTexture(material, 'alphaMap', alphaMaps));
    folder.add(data, 'metalnessMap', metalnessMapKeys).onChange(updateTexture(material, 'metalnessMap', metalnessMaps));

    // TODO metalnessMap

}

var gui = new GUI();
var scene = new Scene();
scene.background = new Color(0x444444);

var camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 10, 50);
camera.position.z = 30;

var renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var ambientLight = new AmbientLight(0x000000);
scene.add(ambientLight);

var lights = [];
lights[0] = new PointLight(0xffffff, 1, 0);
lights[1] = new PointLight(0xffffff, 1, 0);
lights[2] = new PointLight(0xffffff, 1, 0);

lights[0].position.set(0, 200, 0);
lights[1].position.set(100, 200, 100);
lights[2].position.set(- 100, - 200, - 100);

scene.add(lights[0]);
scene.add(lights[1]);
scene.add(lights[2]);

guiScene(gui, scene, camera);

var geometry = new TorusKnotBufferGeometry(10, 3, 150, 15);
geometry = geometry.toNonIndexed();

generateVertexColors(geometry);

var mesh = new Mesh(geometry);
var material = new MeshPhysicalMaterial({ color: 0x2194CE });
guiMaterial(gui, mesh, material, geometry);
guiMeshPhysicalMaterial(gui, mesh, material, geometry);
mesh.material = material;
scene.add(mesh);

var prevFog = false;
var controls = new OrbitControls(camera, renderer.domElement);
controls.update();

var render = function () {

        requestAnimationFrame(render);

        renderer.render(scene, camera);

};

window.addEventListener('resize', function () {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    controls.update();

    renderer.setSize(window.innerWidth, window.innerHeight);

}, false);

render();




