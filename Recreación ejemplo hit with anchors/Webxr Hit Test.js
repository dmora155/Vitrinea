// Importar Three.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.138/build/three.module.js';
import { XRControllerModelFactory } from 'https://cdn.jsdelivr.net/npm/three@0.138/examples/jsm/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'https://cdn.jsdelivr.net/npm/three@0.138/examples/jsm/webxr/XRHandModelFactory.js';

let scene, camera, renderer;
let reticle, hitTestSource = null, hitTestSourceRequested = false;

init();

function init() {
    // Crear la escena
    scene = new THREE.Scene();
    
    // Configurar la cámara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    
    // Configurar el renderizador
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Agregar luz ambiental
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    // Crear el retículo para el hit test
    reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    reticle.visible = false;
    scene.add(reticle);

    // Configurar la sesión XR
    document.body.appendChild(XRButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));
    renderer.xr.addEventListener('sessionstart', onSessionStart);

    // Animar la escena
    renderer.setAnimationLoop(render);
}

function onSessionStart(event) {
    const session = renderer.xr.getSession();
    session.requestReferenceSpace('viewer').then((referenceSpace) => {
        session.requestHitTestSource({ space: referenceSpace }).then((source) => {
            hitTestSource = source;
        });
    });
    session.addEventListener('end', () => {
        hitTestSourceRequested = false;
        hitTestSource = null;
    });
}

function render(timestamp, frame) {
    if (frame) {
        const session = renderer.xr.getSession();
        const referenceSpace = renderer.xr.getReferenceSpace();
        const hitTestResults = frame.getHitTestResults(hitTestSource);

        if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(referenceSpace);
            reticle.visible = true;
            reticle.position.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
        } else {
            reticle.visible = false;
        }
    }
    renderer.render(scene, camera);
}
