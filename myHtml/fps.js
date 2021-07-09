import * as THREE from '../build/three.module.js';

import Stats from '../examples/jsm/libs/stats.module.js';

import { GLTFLoader } from '../examples/jsm/loaders/GLTFLoader.js';

import { Octree } from '../examples/jsm/math/Octree.js';
import { Capsule } from '../examples/jsm/math/Capsule.js';

import { RGBELoader } from '../examples/jsm/loaders/RGBELoader.js';
import { TWEEN } from "../examples/jsm/libs/tween.module.min.js";


const clock = new THREE.Clock();
let textGeometry,textFont,textMesh;
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x88ccff );//0x88ccff

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.rotation.order = 'YXZ';

const ambientlight = new THREE.AmbientLight( 0xffffff,0.2 );//0x88aaee 环境光
scene.add( ambientlight );
//补光
// const fillLight1 = new THREE.DirectionalLight( 0xff9999, 0.1 );
// fillLight1.position.set( - 1, 1, 2 );
// scene.add( fillLight1 );
//
// const fillLight2 = new THREE.DirectionalLight( 0x8888ff, 0.1 );
// fillLight2.position.set( 0, - 1, 0 );
// scene.add( fillLight2 );
//方向光 阴影设置
// const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
// directionalLight.position.set( - 10, 20, - 10 );
// directionalLight.castShadow = true;
// directionalLight.shadow.camera.near = 1;
// directionalLight.shadow.camera.far = 60;
// directionalLight.shadow.camera.right = 30;
// directionalLight.shadow.camera.left = - 30;
// directionalLight.shadow.camera.top	= 20;
// directionalLight.shadow.camera.bottom = - 10;
// directionalLight.shadow.mapSize.width = 2048;
// directionalLight.shadow.mapSize.height = 2048;
// directionalLight.shadow.radius = 1;
// directionalLight.shadow.bias = - 0.0001;
// scene.add( directionalLight );
let envMap;
new RGBELoader()
	.setDataType( THREE.UnsignedByteType )
	.setPath( '../examples/textures/equirectangular/' )
	.load( 'autoshop_01_1k.hdr', function ( texture ) {

		envMap = pmremGenerator.fromEquirectangular(texture).texture;

		//scene.background = envMap;
		scene.environment = envMap;

		texture.dispose();
		pmremGenerator.dispose();
	});

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;

const container = document.getElementById( 'container' );
const info2 = document.getElementById( 'info2' );


container.appendChild( renderer.domElement );

const pmremGenerator = new THREE.PMREMGenerator( renderer );
pmremGenerator.compileEquirectangularShader();

const stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';

container.appendChild( stats.domElement );

const STEPS_PER_FRAME = 1;

const worldOctree = new Octree();

const playerCollider = new Capsule( new THREE.Vector3( 0, 0.35, 0 ), new THREE.Vector3( 0, 1, 0 ), 0.35 );

const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();

let playerOnFloor = false;

const keyStates = {};

let camMove = false;

const raycaster = new THREE.Raycaster();//射线
const mouse = new THREE.Vector2();//鼠标位置
let castRay = false;

document.addEventListener( 'keydown', ( event ) => {

	keyStates[ event.code ] = true;

} );

document.addEventListener( 'keyup', ( event ) => {

	keyStates[ event.code ] = false;

} );

document.addEventListener( 'mousedown', () => {

	//document.body.requestPointerLock();
	camMove = true;

} );

document.addEventListener( 'mouseup', () => {

	//document.body.requestPointerLock();
	camMove = false;

} );

document.body.addEventListener( 'mousemove', ( event ) => {

	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	//if ( document.pointerLockElement === document.body ) {
	if (camMove){
		camera.rotation.y += event.movementX / 500;
		camera.rotation.x += event.movementY / 500;
		// camera.rotation.y -= event.movementX / 500;
		// camera.rotation.x -= event.movementY / 500;
	}
} );

window.addEventListener( 'resize', onWindowResize );

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

document.addEventListener( 'click', () => {
	camera.getWorldDirection( playerDirection );
} );



document.addEventListener( 'dblclick', () => {

	castRay = true;

} );
let  OldPosX,OldPosY,startX,startY,delta,now ;
document.addEventListener( 'touchstart', (event) => {
	info2.innerText = 'touchstart';
	camMove = true;
	if (event.touches.length === 1) {
		const touch2 = event.touches[0];
		mouse.x = (touch2.pageX / window.innerWidth) * 2 - 1;
		mouse.y = -(touch2.pageY / window.innerHeight) * 2 + 1;
		delta = Date.now() - now;
		now = Date.now();
		if (delta>0 && delta<250){
			castRay = true;
		}
		OldPosX = touch2.pageX;
		startX = touch2.pageX;
		OldPosY = touch2.pageY;
		startY =touch2.pageY;
	}
} );
document.addEventListener( 'touchend', () => {
	info2.innerText = 'touchend';
	camMove = false;
} );

document.addEventListener( 'touchmove', onDocumentTouchMove, false );

function onDocumentTouchMove(e){
	info2.innerText = 'touchmove';
	const touch2 = e.changedTouches[0];
	if (e.touches.length === 1) {
		if (camMove){
			camera.rotation.y += (touch2.clientX - OldPosX) * 0.005 ;
			camera.rotation.x += (touch2.clientY - OldPosY) * 0.005 ;
		}
		OldPosX = touch2.clientX;
		OldPosY = touch2.clientY;
	}
}
function playerCollitions() {

	const result = worldOctree.capsuleIntersect( playerCollider );

	playerOnFloor = false;

	if ( result ) {

		playerOnFloor = result.normal.y > 0;

		if ( ! playerOnFloor ) {
			playerVelocity.addScaledVector( result.normal, - result.normal.dot( playerVelocity ) );
		}
		playerCollider.translate( result.normal.multiplyScalar( result.depth ) );
	}
}

function updatePlayer( deltaTime ) {

	if ( playerOnFloor ) {

		const damping = Math.exp( - 3 * deltaTime ) - 1;
		playerVelocity.addScaledVector( playerVelocity, damping );

	} else {

		playerVelocity.y -= 1 * deltaTime;

	}

	const deltaPosition = playerVelocity.clone().multiplyScalar( deltaTime );
	playerCollider.translate( deltaPosition );

	playerCollitions();

	camera.position.copy( playerCollider.end );

}

function getForwardVector() {

	camera.getWorldDirection( playerDirection );
	playerDirection.y = 0;
	playerDirection.normalize();

	return playerDirection;

}

function getSideVector() {

	camera.getWorldDirection( playerDirection );
	playerDirection.y = 0;
	playerDirection.normalize();
	playerDirection.cross( camera.up );

	return playerDirection;

}

function controls( deltaTime ) {

	const speed = 5;

	if ( playerOnFloor ) {

		if ( keyStates[ 'KeyW' ] ) {

			playerVelocity.add( getForwardVector().multiplyScalar( speed * deltaTime ) );

		}

		if ( keyStates[ 'KeyS' ] ) {

			playerVelocity.add( getForwardVector().multiplyScalar( - speed * deltaTime ) );

		}

		if ( keyStates[ 'KeyA' ] ) {

			playerVelocity.add( getSideVector().multiplyScalar( - speed * deltaTime ) );

		}

		if ( keyStates[ 'KeyD' ] ) {

			playerVelocity.add( getSideVector().multiplyScalar( speed * deltaTime ) );

		}

		// if ( keyStates[ 'Space' ] ) {
		//
		// 	playerVelocity.y = 0;
		//
		// }

	}

}
//加载贴图
let texture = new THREE.TextureLoader();

//加载贴图结束
function loadTex(){
	const pictures = scene.getChildByName("Pictures");
	const picCount = pictures.children.length;
	//正常运行
	for (let i = 0 ; i < picCount ; i ++ ){

			texture = new THREE.TextureLoader().load(
				'textures/'+(i+1).toString()+'.png',
				// onLoad callback
				function ( texture ) {
					// in this example we create the material when the texture is loaded
					pictures.children[i].material = new THREE.MeshStandardMaterial( {
						color:0xffffff ,
						roughness:0.15 ,
						map: texture,
						emissive:0x555555,
						emissiveMap: texture,

					} );
				},

				// onProgress callback currently not supported
				undefined,

				// onError callback
				function (  ) {
					texture = new THREE.TextureLoader().load(
						'textures/'+(i+1).toString()+'.jpg',
						function ( texture ) {
							// in this example we create the material when the texture is loaded
							pictures.children[i].material = new THREE.MeshStandardMaterial( {
								color:0xffffff ,
								roughness:0.15 ,
								map: texture,
								emissive:0x555555,
								emissiveMap: texture} );
						},
						undefined,
						undefined)
				}
			);
			createText(i.toString()+"信息", pictures.children[i]);
	}


}
//创建字体fontLoader
const fontLoader = new THREE.FontLoader();
const textGroup = new THREE.Group();

fontLoader.load( '../examples/fonts/FZKai-Z03S_Regular.json',
	function ( font ) {
	textFont = font;
	} );
function createText(texts,obj){
	textGeometry = new THREE.TextGeometry(texts,{
		font: textFont,
		size: 1,
		height: 0.05,
		curveSegments: 5,
		bevelEnabled: false,
		bevelThickness: 0.1,
		bevelSize: 0.01,
		bevelSegments: 1
	});
	textMesh = new THREE.Mesh( textGeometry, new THREE.MeshStandardMaterial( {
		color : 0x495d69 ,
		metalness :0.8 ,
		roughness :0.1 ,
		//wireframe:true,
		} ) );

	obj.attach(textMesh);
	textMesh.position.set(-1.2,2.5,0);
	textMesh.rotation.set(0,0,-1.5708);
	textMesh.scale.set(0.1,.1,0.1);
	scene.attach(textMesh);
	textGroup.add(textMesh); //成组
}


scene.add(textGroup);
const loader = new GLTFLoader().setPath( './models/' );

loader.load( 'scene.gltf', ( gltf ) => {

	scene.add( gltf.scene );
	gltf.scene.scale.set(0.6,0.6,0.6);

	worldOctree.fromGraphNode( gltf.scene );

	gltf.scene.traverse( child => {

		if ( child.isMesh ) {

			 child.castShadow = true;
			 child.receiveShadow = true;
			 //console.log(child.name);


			if ( child.material.map ) {

				child.material.map.anisotropy = 4;

			}

		}

	} );

	loadTex();
	animate();
	//createText("i");
} );
loader.load('FloorCollider.gltf',( collider ) =>{
	scene.add( collider.scene );
	collider.scene.scale.set(0.6,0.6,0.6);
	collider.scene.getChildByName("FloorCollider").material = new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0});
})

function animate() {

	const deltaTime = Math.min( 0.05, clock.getDelta() ) / STEPS_PER_FRAME;

	// we look for collisions in substeps to mitigate the risk of
	// an object traversing another too quickly for detection.

	for ( let i = 0 ; i < STEPS_PER_FRAME ; i ++ ) {

		controls( deltaTime );

		updatePlayer( deltaTime );

		//updateSpheres( deltaTime );

	}

	if (castRay){

		raycast('FloorCollider');

	}
	TWEEN.update();
	renderer.render( scene, camera );

	stats.update();

	requestAnimationFrame( animate );

}

function raycast(ObjName){

	raycaster.setFromCamera(mouse,camera);
	const intersects = raycaster.intersectObject( scene.getChildByName(ObjName),false);
	castRay = false;
	if (intersects.length > 0) {
		const point = intersects[0].point;
		//info2.innerText = intersects[0].distance;
		movePlayer(playerCollider.start,point);
		//playerCollider.set(new THREE.Vector3(point.x, 0.35, point.z), new THREE.Vector3(point.x, 1, point.z), playerCollider.radius);
		playerCollitions();
		camera.position.copy(playerCollider.end);
	} else {
		alert('点击地面移动');
	}
}

function movePlayer(oldP, newP) {
	let tween = new TWEEN.Tween({
		x1: oldP.x,
		y1: oldP.y,
		z1: oldP.z,
		// x2: oldT.x,
		// y2: oldT.y,
		// z2: oldT.z,
	});
	tween.to(
		{
			x1: newP.x,
			y1: newP.y,
			z1: newP.z,
			// x2: newT.x,
			// y2: newT.y,
			// z2: newT.z,
		},
		2000
	);

	// 每一帧执行函数 、这个地方就是核心了、每变一帧跟新一次页面元素
	tween.onUpdate((object) => {
		playerCollider.set(new THREE.Vector3(object.x1, playerCollider.start.y, object.z1), new THREE.Vector3(object.x1, playerCollider.end.y, object.z1), playerCollider.radius);
	});

	// 动画完成后的执行函数
	tween.onComplete(() => {
		tweenCallBack();
	});

	tween.easing(TWEEN.Easing.Cubic.InOut);
	// 这个函数必须有、这个是启动函数、不加不能启动
	tween.start();
}

function tweenCallBack() {
	console.log(playerCollider);
}

