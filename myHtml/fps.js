import * as THREE from '../build/three.module.js';

import Stats from '../examples/jsm/libs/stats.module.js';

import { GLTFLoader } from '../examples/jsm/loaders/GLTFLoader.js';

import { Octree } from '../examples/jsm/math/Octree.js';
import { Capsule } from '../examples/jsm/math/Capsule.js';


const clock = new THREE.Clock();

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x88ccff );//0x88ccff

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.rotation.order = 'YXZ';

const ambientlight = new THREE.AmbientLight( 0xffffff,5.5 );//0x88aaee
scene.add( ambientlight );

// const fillLight1 = new THREE.DirectionalLight( 0xff9999, 0.1 );
// fillLight1.position.set( - 1, 1, 2 );
// scene.add( fillLight1 );
//
// const fillLight2 = new THREE.DirectionalLight( 0x8888ff, 0.1 );
// fillLight2.position.set( 0, - 1, 0 );
// scene.add( fillLight2 );

const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
directionalLight.position.set( - 10, 20, - 10 );
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 60;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.left = - 30;
directionalLight.shadow.camera.top	= 20;
directionalLight.shadow.camera.bottom = - 10;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.radius = 1;
directionalLight.shadow.bias = - 0.0001;
//scene.add( directionalLight );

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;

const container = document.getElementById( 'container' );
const info2 = document.getElementById( 'info2' );


container.appendChild( renderer.domElement );

const stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';

container.appendChild( stats.domElement );

//const GRAVITY = 30;

//const NUM_SPHERES = 20;
//const SPHERE_RADIUS = 0.2;

const STEPS_PER_FRAME = 10;

//const sphereGeometry = new THREE.SphereGeometry( SPHERE_RADIUS, 32, 32 );
//const sphereMaterial = new THREE.MeshStandardMaterial( { color: 0x888855, roughness: 0.8, metalness: 0.5 } );

//const spheres = [];
//let sphereIdx = 0;

// for ( let i = 0; i < NUM_SPHERES; i ++ ) {
//
// 	const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
// 	sphere.castShadow = true;
// 	sphere.receiveShadow = true;
//
// 	scene.add( sphere );
//
// 	spheres.push( { mesh: sphere, collider: new THREE.Sphere( new THREE.Vector3( 0, - 100, 0 ), SPHERE_RADIUS ), velocity: new THREE.Vector3() } );
//
// }

const worldOctree = new Octree();

const playerCollider = new Capsule( new THREE.Vector3( 0, 0.35, 0 ), new THREE.Vector3( 0, 1, 0 ), 0.35 );

const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();

let playerOnFloor = false;

const keyStates = {};

let camMove = false;

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

	//if ( document.pointerLockElement === document.body ) {
	if (camMove){
		camera.rotation.y -= event.movementX / 500;
		camera.rotation.x -= event.movementY / 500;
	}
		// camera.rotation.y -= event.movementX / 500;
		// camera.rotation.x -= event.movementY / 500;

	//}

} );

window.addEventListener( 'resize', onWindowResize );

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

document.addEventListener( 'click', () => {

//	const sphere = spheres[ sphereIdx ];

	camera.getWorldDirection( playerDirection );

//	sphere.collider.center.copy( playerCollider.end );
//	sphere.velocity.copy( playerDirection ).multiplyScalar( 30 );

//	sphereIdx = ( sphereIdx + 1 ) % spheres.length;

} );

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

// function spheresCollisions() {
//
// 	for ( let i = 0; i < spheres.length; i ++ ) {
//
// 		const s1 = spheres[ i ];
//
// 		for ( let j = i + 1; j < spheres.length; j ++ ) {
//
// 			const s2 = spheres[ j ];
//
// 			const d2 = s1.collider.center.distanceToSquared( s2.collider.center );
// 			const r = s1.collider.radius + s2.collider.radius;
// 			const r2 = r * r;
//
// 			if ( d2 < r2 ) {
//
// 				const normal = s1.collider.clone().center.sub( s2.collider.center ).normalize();
// 				const v1 = normal.clone().multiplyScalar( normal.dot( s1.velocity ) );
// 				const v2 = normal.clone().multiplyScalar( normal.dot( s2.velocity ) );
// 				s1.velocity.add( v2 ).sub( v1 );
// 				s2.velocity.add( v1 ).sub( v2 );
//
// 				const d = ( r - Math.sqrt( d2 ) ) / 2;
//
// 				s1.collider.center.addScaledVector( normal, d );
// 				s2.collider.center.addScaledVector( normal, - d );
//
// 			}
//
// 		}
//
// 	}
//
// }

// function updateSpheres( deltaTime ) {
//
// 	spheres.forEach( sphere =>{
//
// 		sphere.collider.center.addScaledVector( sphere.velocity, deltaTime );
//
// 		const result = worldOctree.sphereIntersect( sphere.collider );
//
// 		if ( result ) {
//
// 			sphere.velocity.addScaledVector( result.normal, - result.normal.dot( sphere.velocity ) * 1.5 );
// 			sphere.collider.center.add( result.normal.multiplyScalar( result.depth ) );
//
// 		} else {
//
// 			sphere.velocity.y -= GRAVITY * deltaTime;
//
// 		}
//
// 		const damping = Math.exp( - 1.5 * deltaTime ) - 1;
// 		sphere.velocity.addScaledVector( sphere.velocity, damping );
//
// 		spheresCollisions();
//
// 		sphere.mesh.position.copy( sphere.collider.center );
//
// 	} );
//
// }

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
let texture = new THREE.TextureLoader().load( 'textures/1.png' );




//加载贴图结束
function loadTex(){
	let pictures = scene.getChildByName("Pictures");
	const picCount = pictures.children.length;
	//正常运行
	for (let i = 0 ; i < picCount ; i ++ ){

			texture = new THREE.TextureLoader().load(
				'textures/'+(i+1).toString()+'.png',
				// onLoad callback
				function ( texture ) {
					// in this example we create the material when the texture is loaded
					pictures.children[i].material = new THREE.MeshBasicMaterial( { map: texture } );
				},

				// onProgress callback currently not supported
				undefined,

				// onError callback
				function (  ) {
					texture = new THREE.TextureLoader().load(
						'textures/'+(i+1).toString()+'.jpg',
						function ( texture ) {
							// in this example we create the material when the texture is loaded
							pictures.children[i].material = new THREE.MeshBasicMaterial( { map: texture } );
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
let textGeometry,textFont,textMesh;
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
	textMesh = new THREE.Mesh( textGeometry, new THREE.MeshBasicMaterial( { color: 0x333333 } ) );

	//textMesh.position.set(pos.x,pos.z,pos.y);
	//textMesh.scale.set(scale.x,scale.y,scale.z);
	obj.attach(textMesh);
	textMesh.position.set(-1.2,2.5,0);
	textMesh.rotation.set(0,0,-1.5708);
	textMesh.scale.set(0.1,.1,0.1);
	//textGroup.add(textMesh); //成组，方便缩放大小


}
textGroup.scale.set(0.6,0.6,-0.6);

scene.add(textGroup);
const loader = new GLTFLoader().setPath( './models/' );

loader.load( 'scene1.gltf', ( gltf ) => {

	scene.add( gltf.scene );
	gltf.scene.scale.set(0.6,0.6,0.6);

	worldOctree.fromGraphNode( gltf.scene );

	gltf.scene.traverse( child => {
		// if (child.material){
		// 	child.material.side = THREE.DoubleSide;
		// }
		//console.log(child.name);

		if ( child.isMesh ) {

			 child.castShadow = true;
			 child.receiveShadow = true;


			if ( child.material.map ) {

				child.material.map.anisotropy = 4;

			}

		}

	} );
	loadTex();
	animate();
	//createText("i");
} );

function animate() {

	const deltaTime = Math.min( 0.05, clock.getDelta() ) / STEPS_PER_FRAME;

	// we look for collisions in substeps to mitigate the risk of
	// an object traversing another too quickly for detection.

	for ( let i = 0 ; i < STEPS_PER_FRAME ; i ++ ) {

		controls( deltaTime );

		updatePlayer( deltaTime );

		//updateSpheres( deltaTime );

	}

	renderer.render( scene, camera );

	stats.update();

	requestAnimationFrame( animate );

	info2.innerText = deltaTime;

}

