export default class Layout {
  static getLeftFromParent(element, parentClassName) {
    if (element === undefined ) {
      return 0;
    }
    var offset = element?.offsetLeft;
    if (element?.offsetParent != null) {
      if (element.offsetParent.className == parentClassName) {
        return offset;
      }
      offset += this.getLeftFromParent(element.offsetParent, parentClassName);
    }
    return offset;
  }
  static getRightFromParent(element, parentClassName) {
    var obj = element;
    var offsetMaxX = obj.offsetLeft + obj.offsetWidth;
    var parent = null;
    while (obj != null) {
      if (obj.offsetParent.className == parentClassName) {
        parent = obj.offsetParent;
        break;
      }
      offsetMaxX += obj.offsetLeft + obj.offsetWidth;
      obj = obj.offsetParent;
    }
    if (!parent) {
      parent = obj.offsetParent;
    }
    return parent.getBoundingClientRect().width - offsetMaxX;
  }

  // const resizeObserver = new ResizeObserver((entries) => {
  // this.fromInputAbsoluteLeft = this.getParentLeft(this.$refs.fromInput[0]);
  // this.contentWidth = entries[0].borderBoxSize[0].inlineSize + "px";
  // });
  // resizeObserver.observe(this.$refs.fromInput[0]);
  // -
  // Number(
  //   window
  //     .getComputedStyle(this.$refs.fromInput[0], null)
  //     .getPropertyValue("padding-left")
  //     .replace("px", "")
  // );
  static isMobile() {
    return window.matchMedia("(max-width: 420px)").matches;
  }
}
