// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Node)
    public target: cc.Node = null;
    @property(cc.Camera)
    public camera: cc.Camera = null;

    //旋转速度值
    @property
    public xSpeed: number = 5;
    @property
    public ySpeed: number = 5;

    //y轴角度限制，设置成一样则该轴不旋转
    @property
    public yMinLimit: number = -90;
    @property
    public yMaxLimit: number = 90;

    //x轴角度限制，同上
    public leftMax: number = -365;
    public rightMax: number = 365;

    //距离限制，同上
    @property
    public minDistance: number = 1;
    @property
    public maxDistance: number = 100;
    @property
    public G_fZoomSpeed: number = -16; //缩放值

    private _cameraNode: cc.Node;
    public get cameraNode(): cc.Node {
        if (this._cameraNode == null) {
            this._cameraNode = this.camera.node;
        }
        return this._cameraNode;
    }

    private _cameraPos: cc.Vec3 = cc.Vec3.ZERO;//记得赋初始值 不然报错
    public get cameraPos(): cc.Vec3 {
        this.cameraNode.getPosition(this._cameraPos);
        return this._cameraPos;
    }
    public set cameraPos(v: cc.Vec3) {
        this.cameraNode.setPosition(v);
        this._cameraPos = v;
    }

    private _targetPos: cc.Vec3 = cc.Vec3.ZERO;//记得赋初始值 不然报错
    public get targetPos(): cc.Vec3 {
        this.target.getPosition(this._targetPos);
        return this._targetPos;
    }

    //设置旋转角度
    private x: number = 0;
    private y: number = 0;
    private z: number = 0;

    private distance: number = 5;

    private rotation: cc.Quat = new cc.Quat();
    private position: cc.Vec3 = cc.Vec3.ZERO;

    private curTouchCount: number = 0;
    private isTiaoJie: boolean;


    start() {
        //this.distance = this.targetPos.sub(this.cameraPos).mag();

        this.SetPoint(this.cameraPos);

        //Mouse的事件示例
        this.node.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
        this.node.on(cc.Node.EventType.MOUSE_UP, this.onMouseUp, this);
        this.node.on(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);

        //Touch的事件示例
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    }

    onDestroy() {
        //Mouse的事件示例
        this.node.off(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
        this.node.off(cc.Node.EventType.MOUSE_UP, this.onMouseUp, this);
        this.node.off(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);

        //Touch的事件示例
        this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    }

    /**重置摄像机的点位 */
    SetPoint(pos: cc.Vec3) {
        this.distance = this.targetPos.sub(this.cameraPos).mag();
        console.log("设置 distance:" + this.distance);

        this.cameraPos = pos;
        this.position = pos;

        this.x = this.cameraNode.eulerAngles.y;
        this.y = this.cameraNode.eulerAngles.x;
        this.z = 0;

        this.cameraNode.lookAt(this.targetPos);
        this.cameraNode.getRotation(this.rotation);
    }


    onTouchStart(event: cc.Event.EventTouch) {
        var arr: cc.Event.EventTouch[] = event.getTouches();

        if (arr.length == 1) {
            console.log("onTouchStart 1");
            this.curTouchCount = 1;
        }
        else if (arr.length == 2) {
            console.log("onTouchStart 2");
            this.curTouchCount = 2;
        }
    }

    onTouchMove(event: cc.Event.EventTouch) {
        //此句加上是为了让手指触控为1时 再多加一个触发为2的效果
        if (event.getTouches().length == 2) {
            this.curTouchCount = 2;
        }

        if (this.curTouchCount == 1) {
            //console.log("onTouchMove 1");
            this.onTouchOne(event);
        }
        else if (this.curTouchCount == 2) {
            //console.log("onTouchMove 2");
            this.onTouchTwo(event);
        }
    }

    /**处理双指触控 */
    onTouchTwo(event: cc.Event.EventTouch): void {
        var arr: cc.Event.EventTouch[] = event.getTouches();

        if (arr.length != 2) {
            return;
        }

        var oldDistance = arr[1].getPreviousLocation().sub(arr[0].getPreviousLocation()).mag();
        var newDistance = arr[1].getLocation().sub(arr[0].getLocation()).mag();

        var offset = newDistance - oldDistance;
        var scaleFactor = offset / 100;
        this.processToFarAndNear(scaleFactor);
    }


    processToFarAndNear(scaleFactor: number) {
        var cameraPos = cc.Vec3.ZERO;
        var targetPos = cc.Vec3.ZERO;
        this.cameraNode.getPosition(cameraPos);
        this.target.getPosition(targetPos);

        var nexPos = cameraPos.add((cameraPos.sub(targetPos)).normalize().mul(scaleFactor * this.G_fZoomSpeed * 0.5));
        this.cameraNode.setPosition(nexPos);

        var nearPos = targetPos.sub(targetPos.sub(cameraPos).normalize().mul(this.minDistance));
        var farPos = targetPos.sub(targetPos.sub(cameraPos).normalize().mul(this.maxDistance));

        var x = nearPos.x < farPos.x ? cc.misc.clampf(nexPos.x, nearPos.x, farPos.x) : cc.misc.clampf(nexPos.x, farPos.x, nearPos.x);

        var y = nearPos.y < farPos.y ? cc.misc.clampf(nexPos.y, nearPos.y, farPos.y) : cc.misc.clampf(nexPos.y, farPos.y, nearPos.y);

        var z = nearPos.z < farPos.z ? cc.misc.clampf(nexPos.z, nearPos.z, farPos.z) : cc.misc.clampf(nexPos.z, farPos.z, nearPos.z);

        //Debug.Log(nearPos + "nearPos" + farPos + "farPos" + nexPos + "nexPos"+   "x"+ Mathf.Clamp(nexPos.x, nearPos.x, farPos.x) + "y"+ Mathf.Clamp(nexPos.y, nearPos.y, farPos.y) + "z"+ Mathf.Clamp(nexPos.z, nearPos.z, farPos.z));
        this.cameraNode.setPosition(new cc.Vec3(x, y, z));

        this.isTiaoJie = true;
    }


    onTouchOne(event: cc.Event.EventTouch) {

        if (this.isTiaoJie == true) {
            this.SetPoint(this.cameraPos);
            this.isTiaoJie = false;
        }

        let pre = event.getPreviousLocation();
        let cur = event.getLocation();
        var dir = cur.sub(pre);

        if ((this.y > 90 && this.y < 270) || (this.y < -90 && this.y > -270))
            this.x = this.x + dir.x * this.xSpeed * 0.13;
        else
            this.x = this.x - dir.x * this.xSpeed * 0.13;

        this.y = this.y - dir.y * this.ySpeed * -0.13;

        if (this.y > 180)
            this.y -= 360;

        this.x = this.ClampAngle(this.x, this.leftMax, this.rightMax);
        this.y = this.ClampAngle(this.y, this.yMinLimit, this.yMaxLimit);

        this.distance = cc.misc.clampf(this.distance, this.minDistance, this.maxDistance);
        this.rotation = this.rotation.fromEuler(new cc.Vec3(this.y, this.x, this.z));
        var disVector = new cc.Vec3(0, 0, this.distance);

        //不要阻尼感 要阻尼感效果不好 会跳
        this.position = this.QuatMulVec(this.rotation, disVector).add(new cc.Vec3(this.target.x, this.target.y, this.target.z));
        this.cameraNode.setPosition(this.position);
        var eulerVec3 = cc.Vec3.ZERO;
        this.rotation.toEuler(eulerVec3);
        this.cameraNode.eulerAngles = eulerVec3;
    }


    ClampAngle(angle: number, min: number, max: number): number {
        if (angle < -360)
            angle = angle + 360;

        if (angle > 360)
            angle = angle - 360;

        return cc.misc.clampf(angle, min, max);
    }


    /** 处理电脑端 摄像机视角 */
    onMouseWheel(event: cc.Event.EventMouse) {
        if (cc.sys.platform != cc.sys.WIN32) {
            return;
        }
        var scaleFactor = event.getScrollY();

        this.processToFarAndNear(scaleFactor);
    }

    onMouseDown(event: cc.Event.EventMouse) {
        let mouseType = event.getButton();
        if (mouseType === cc.Event.EventMouse.BUTTON_LEFT) {
            // 鼠标左键按下
            let mousePoint = event.getLocation();
            let localPoint = this.node.convertToNodeSpace(mousePoint);
            console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! 鼠标左键按下:");
        } else if (mouseType === cc.Event.EventMouse.BUTTON_MIDDLE) {
            // 鼠标中键按下

        } else if (mouseType === cc.Event.EventMouse.BUTTON_RIGHT) {
            // 鼠标右键按下
        }
    }

    onMouseUp(event: cc.Event.EventMouse) {
        let mouseType = event.getButton();
        if (mouseType === cc.Event.EventMouse.BUTTON_LEFT) {
            // 鼠标左键释放
            let mousePoint = event.getLocation();
            let localPoint = this.node.convertToNodeSpace(mousePoint);
        } else if (mouseType === cc.Event.EventMouse.BUTTON_MIDDLE) {
            // 鼠标中键释放

        } else if (mouseType === cc.Event.EventMouse.BUTTON_RIGHT) {
            // 鼠标右键释放

        }
    }


    /**四元数乘三维向量 */
    QuatMulVec(rotation: cc.Quat, point: cc.Vec3): cc.Vec3 {
        var num1 = rotation.x * 2;
        var num2 = rotation.y * 2;
        var num3 = rotation.z * 2;
        var num4 = rotation.x * num1;
        var num5 = rotation.y * num2;
        var num6 = rotation.z * num3;
        var num7 = rotation.x * num2;
        var num8 = rotation.x * num3;
        var num9 = rotation.y * num3;
        var num10 = rotation.w * num1;
        var num11 = rotation.w * num2;
        var num12 = rotation.w * num3;
        var vector3: cc.Vec3 = cc.Vec3.ONE;
        vector3.x = (1.0 - (num5 + num6)) * point.x + (num7 - num12) * point.y + (num8 + num11) * point.z;
        vector3.y = (num7 + num12) * point.x + (1.0 - (num4 + num6)) * point.y + (num9 - num10) * point.z;
        vector3.z = (num8 - num11) * point.x + (num9 + num10) * point.y + (1.0 - (num4 + num5)) * point.z;
        return vector3;
    }




}
