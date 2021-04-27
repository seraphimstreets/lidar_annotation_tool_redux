class GenericTool {

    constructor() {
      if (this.constructor == GenericTool) {
        throw new Error("Abstract classes can't be instantiated.");
      }
    }

    init(){
        throw new Error("Method 'init()' must be implemented.");
    }

    handleMouseDown(){
        throw new Error("Method 'handleMouseDown()' must be implemented.");
    }

    handleMouseUp(){
        throw new Error("Method 'handleMouseUp()' must be implemented.");
    }

    handleMouseMove(){
        throw new Error("Method 'handleMouseMove()' must be implemented.");
    }

    handleKeyDown(){
        throw new Error("Method 'handleKeyDown()' must be implemented.");
    }

    handleKeyUp(){
        throw new Error("Method 'handleKeyDown()' must be implemented.");
    }

    handleSubmit(){
        throw new Error("Method 'handleSubmit()' must be implemented.");
    }
  
    reset(){
        throw new Error("Method 'reset()' must be implemented.");
    }
  }

