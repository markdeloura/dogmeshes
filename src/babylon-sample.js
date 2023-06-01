// Babylon sample code

function createLabel(scene, position, text) {
    var dynamicTexture = new BABYLON.DynamicTexture(
        "dynamicTexture" + text,
        512,
        scene,
        true
    );
    dynamicTexture.hasAlpha = true;
    dynamicTexture.drawText(
        text,
        null,
        null,
        "64px Arial",
        "white",
        "transparent"
    );

    var plane = BABYLON.Mesh.CreatePlane("label" + text, 2, scene);
    plane.scaling.scaleInPlace(3);
    plane.position.copyFrom(position);
    plane.position.y += 2.5;
    plane.position.x += 1.4;
    //plane.rotation.y += Math.PI;
    //plane.rotation.x = Math.PI * 0.5;
    plane.rotation.z += 1;
    plane.material = new BABYLON.PBRMaterial("material" + text, scene);
    plane.material.unlit = true;
    plane.material.backFaceCulling = false;
    plane.material.albedoTexture = dynamicTexture;
    plane.material.useAlphaFromAlbedoTexture = true;
}

function addMat(mesh, col = null) {
    mesh.material = new BABYLON.StandardMaterial("mat" + mesh.name);
    if (!col) {
        col = BABYLON.Color3.Random();
    }
    mesh.material.diffuseColor = col;
    return col;
}

var curX = 0;

var hinge = function (scene) {
    let box1 = BABYLON.Mesh.CreateBox("hingeBox1", 1, scene);
    box1.position.x = curX;
    box1.position.y = 1;
    box1.scaling.y = 0.2;
    const col = addMat(box1);

    let box2 = BABYLON.Mesh.CreateBox("hingeBox2", 1, scene);
    box2.position.x = curX;
    box2.position.y = 1;
    box2.position.z = -1;
    box2.scaling.y = 0.2;
    addMat(box2, col);

    let box3 = BABYLON.Mesh.CreateBox("hingeBox3", 1, scene);
    box3.position.x = curX;
    box3.position.y = 1;
    box3.position.z = -2;
    box3.scaling.y = 0.2;
    addMat(box3, col);

    let agg1 = new BABYLON.PhysicsAggregate(
        box1,
        BABYLON.PhysicsShapeType.BOX,
        { mass: 0, restitution: 1 },
        scene
    );
    let agg2 = new BABYLON.PhysicsAggregate(
        box2,
        BABYLON.PhysicsShapeType.BOX,
        { mass: 1, restitution: 1 },
        scene
    );
    let agg3 = new BABYLON.PhysicsAggregate(
        box3,
        BABYLON.PhysicsShapeType.BOX,
        { mass: 2, restitution: 1 },
        scene
    );

    let joint = new BABYLON.HingeConstraint(
        new BABYLON.Vector3(0, 0, -0.5),
        new BABYLON.Vector3(0, 0, 0.5),
        undefined,
        undefined,
        scene
    );
    agg1.body.addConstraint(agg2.body, joint);

    let joint2 = new BABYLON.HingeConstraint(
        new BABYLON.Vector3(0, 0, -0.5),
        new BABYLON.Vector3(0, 0, 0.5),
        undefined,
        undefined,
        scene
    );
    agg2.body.addConstraint(agg3.body, joint2);

    createLabel(scene, box1.position, "hinge");
};

var createScene = function () {
    // Scene
    var scene = new BABYLON.Scene(engine);

    var tiledGround = BABYLON.MeshBuilder.CreateTiledGround("tiled ground", {xmin:-5, xmax:5, zmin:-5, zmax:5}, scene);

    let useViewer = false;

    var plugin = new BABYLON.HavokPlugin();
    scene.enablePhysics(new BABYLON.Vector3(0, -10, 0), plugin);

    // Physics engine
    var physicsViewer;
    if (useViewer) {
        physicsViewer = new BABYLON.PhysicsViewer();
    }
    // Camera
    var camera = new BABYLON.FreeCamera(
        "camera1",
        new BABYLON.Vector3(0, 4, -24),
        scene
    );
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);

    // Lightning
    var light = new BABYLON.HemisphericLight(
        "light1",
        new BABYLON.Vector3(0, 1, 0),
        scene
    );
    light.intensity = 0.7;
    var light2 = new BABYLON.HemisphericLight(
        "light2",
        new BABYLON.Vector3(0, -1, 0),
        scene
    );
    light2.intensity = 0.2;

    // joints
    hinge(scene);
    return scene;
};
