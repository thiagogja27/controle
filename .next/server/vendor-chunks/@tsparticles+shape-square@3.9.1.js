"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/@tsparticles+shape-square@3.9.1";
exports.ids = ["vendor-chunks/@tsparticles+shape-square@3.9.1"];
exports.modules = {

/***/ "(ssr)/./node_modules/.pnpm/@tsparticles+shape-square@3.9.1/node_modules/@tsparticles/shape-square/esm/SquareDrawer.js":
/*!***********************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/@tsparticles+shape-square@3.9.1/node_modules/@tsparticles/shape-square/esm/SquareDrawer.js ***!
  \***********************************************************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   SquareDrawer: () => (/* binding */ SquareDrawer)\n/* harmony export */ });\n/* harmony import */ var _Utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Utils.js */ \"(ssr)/./node_modules/.pnpm/@tsparticles+shape-square@3.9.1/node_modules/@tsparticles/shape-square/esm/Utils.js\");\n\nconst sides = 4;\nclass SquareDrawer {\n    constructor() {\n        this.validTypes = [\"edge\", \"square\"];\n    }\n    draw(data) {\n        (0,_Utils_js__WEBPACK_IMPORTED_MODULE_0__.drawSquare)(data);\n    }\n    getSidesCount() {\n        return sides;\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvLnBucG0vQHRzcGFydGljbGVzK3NoYXBlLXNxdWFyZUAzLjkuMS9ub2RlX21vZHVsZXMvQHRzcGFydGljbGVzL3NoYXBlLXNxdWFyZS9lc20vU3F1YXJlRHJhd2VyLmpzIiwibWFwcGluZ3MiOiI7Ozs7O0FBQXdDO0FBQ3hDO0FBQ087QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVEscURBQVU7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL215LXByb2plY3QvLi9ub2RlX21vZHVsZXMvLnBucG0vQHRzcGFydGljbGVzK3NoYXBlLXNxdWFyZUAzLjkuMS9ub2RlX21vZHVsZXMvQHRzcGFydGljbGVzL3NoYXBlLXNxdWFyZS9lc20vU3F1YXJlRHJhd2VyLmpzP2UxOTciXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZHJhd1NxdWFyZSB9IGZyb20gXCIuL1V0aWxzLmpzXCI7XG5jb25zdCBzaWRlcyA9IDQ7XG5leHBvcnQgY2xhc3MgU3F1YXJlRHJhd2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy52YWxpZFR5cGVzID0gW1wiZWRnZVwiLCBcInNxdWFyZVwiXTtcbiAgICB9XG4gICAgZHJhdyhkYXRhKSB7XG4gICAgICAgIGRyYXdTcXVhcmUoZGF0YSk7XG4gICAgfVxuICAgIGdldFNpZGVzQ291bnQoKSB7XG4gICAgICAgIHJldHVybiBzaWRlcztcbiAgICB9XG59XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/.pnpm/@tsparticles+shape-square@3.9.1/node_modules/@tsparticles/shape-square/esm/SquareDrawer.js\n");

/***/ }),

/***/ "(ssr)/./node_modules/.pnpm/@tsparticles+shape-square@3.9.1/node_modules/@tsparticles/shape-square/esm/Utils.js":
/*!****************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/@tsparticles+shape-square@3.9.1/node_modules/@tsparticles/shape-square/esm/Utils.js ***!
  \****************************************************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   drawSquare: () => (/* binding */ drawSquare)\n/* harmony export */ });\nconst fixFactorSquared = 2, fixFactor = Math.sqrt(fixFactorSquared), double = 2;\nfunction drawSquare(data) {\n    const { context, radius } = data, fixedRadius = radius / fixFactor, fixedDiameter = fixedRadius * double;\n    context.rect(-fixedRadius, -fixedRadius, fixedDiameter, fixedDiameter);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvLnBucG0vQHRzcGFydGljbGVzK3NoYXBlLXNxdWFyZUAzLjkuMS9ub2RlX21vZHVsZXMvQHRzcGFydGljbGVzL3NoYXBlLXNxdWFyZS9lc20vVXRpbHMuanMiLCJtYXBwaW5ncyI6Ijs7OztBQUFBO0FBQ087QUFDUCxZQUFZLGtCQUFrQjtBQUM5QjtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vbXktcHJvamVjdC8uL25vZGVfbW9kdWxlcy8ucG5wbS9AdHNwYXJ0aWNsZXMrc2hhcGUtc3F1YXJlQDMuOS4xL25vZGVfbW9kdWxlcy9AdHNwYXJ0aWNsZXMvc2hhcGUtc3F1YXJlL2VzbS9VdGlscy5qcz9lMzY1Il0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGZpeEZhY3RvclNxdWFyZWQgPSAyLCBmaXhGYWN0b3IgPSBNYXRoLnNxcnQoZml4RmFjdG9yU3F1YXJlZCksIGRvdWJsZSA9IDI7XG5leHBvcnQgZnVuY3Rpb24gZHJhd1NxdWFyZShkYXRhKSB7XG4gICAgY29uc3QgeyBjb250ZXh0LCByYWRpdXMgfSA9IGRhdGEsIGZpeGVkUmFkaXVzID0gcmFkaXVzIC8gZml4RmFjdG9yLCBmaXhlZERpYW1ldGVyID0gZml4ZWRSYWRpdXMgKiBkb3VibGU7XG4gICAgY29udGV4dC5yZWN0KC1maXhlZFJhZGl1cywgLWZpeGVkUmFkaXVzLCBmaXhlZERpYW1ldGVyLCBmaXhlZERpYW1ldGVyKTtcbn1cbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/.pnpm/@tsparticles+shape-square@3.9.1/node_modules/@tsparticles/shape-square/esm/Utils.js\n");

/***/ }),

/***/ "(ssr)/./node_modules/.pnpm/@tsparticles+shape-square@3.9.1/node_modules/@tsparticles/shape-square/esm/index.js":
/*!****************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/@tsparticles+shape-square@3.9.1/node_modules/@tsparticles/shape-square/esm/index.js ***!
  \****************************************************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   loadSquareShape: () => (/* binding */ loadSquareShape)\n/* harmony export */ });\n/* harmony import */ var _SquareDrawer_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./SquareDrawer.js */ \"(ssr)/./node_modules/.pnpm/@tsparticles+shape-square@3.9.1/node_modules/@tsparticles/shape-square/esm/SquareDrawer.js\");\n\nasync function loadSquareShape(engine, refresh = true) {\n    engine.checkVersion(\"3.9.1\");\n    await engine.addShape(new _SquareDrawer_js__WEBPACK_IMPORTED_MODULE_0__.SquareDrawer(), refresh);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvLnBucG0vQHRzcGFydGljbGVzK3NoYXBlLXNxdWFyZUAzLjkuMS9ub2RlX21vZHVsZXMvQHRzcGFydGljbGVzL3NoYXBlLXNxdWFyZS9lc20vaW5kZXguanMiLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBaUQ7QUFDMUM7QUFDUDtBQUNBLDhCQUE4QiwwREFBWTtBQUMxQyIsInNvdXJjZXMiOlsid2VicGFjazovL215LXByb2plY3QvLi9ub2RlX21vZHVsZXMvLnBucG0vQHRzcGFydGljbGVzK3NoYXBlLXNxdWFyZUAzLjkuMS9ub2RlX21vZHVsZXMvQHRzcGFydGljbGVzL3NoYXBlLXNxdWFyZS9lc20vaW5kZXguanM/ODMyMSJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTcXVhcmVEcmF3ZXIgfSBmcm9tIFwiLi9TcXVhcmVEcmF3ZXIuanNcIjtcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkU3F1YXJlU2hhcGUoZW5naW5lLCByZWZyZXNoID0gdHJ1ZSkge1xuICAgIGVuZ2luZS5jaGVja1ZlcnNpb24oXCIzLjkuMVwiKTtcbiAgICBhd2FpdCBlbmdpbmUuYWRkU2hhcGUobmV3IFNxdWFyZURyYXdlcigpLCByZWZyZXNoKTtcbn1cbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/.pnpm/@tsparticles+shape-square@3.9.1/node_modules/@tsparticles/shape-square/esm/index.js\n");

/***/ })

};
;