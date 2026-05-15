"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/@tsparticles+plugin-easing-quad@3.9.1";
exports.ids = ["vendor-chunks/@tsparticles+plugin-easing-quad@3.9.1"];
exports.modules = {

/***/ "(ssr)/./node_modules/.pnpm/@tsparticles+plugin-easing-quad@3.9.1/node_modules/@tsparticles/plugin-easing-quad/esm/index.js":
/*!****************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/@tsparticles+plugin-easing-quad@3.9.1/node_modules/@tsparticles/plugin-easing-quad/esm/index.js ***!
  \****************************************************************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   loadEasingQuadPlugin: () => (/* binding */ loadEasingQuadPlugin)\n/* harmony export */ });\n/* harmony import */ var _tsparticles_engine__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tsparticles/engine */ \"(ssr)/./node_modules/.pnpm/@tsparticles+engine@3.9.1/node_modules/@tsparticles/engine/esm/index.js\");\n\nasync function loadEasingQuadPlugin(engine, refresh = true) {\n    engine.checkVersion(\"3.9.1\");\n    await engine.addEasing(_tsparticles_engine__WEBPACK_IMPORTED_MODULE_0__.EasingType.easeInQuad, value => value ** 2, false);\n    await engine.addEasing(_tsparticles_engine__WEBPACK_IMPORTED_MODULE_0__.EasingType.easeOutQuad, value => 1 - (1 - value) ** 2, false);\n    await engine.addEasing(_tsparticles_engine__WEBPACK_IMPORTED_MODULE_0__.EasingType.easeInOutQuad, value => (value < 0.5 ? 2 * value ** 2 : 1 - (-2 * value + 2) ** 2 / 2), false);\n    await engine.refresh(refresh);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvLnBucG0vQHRzcGFydGljbGVzK3BsdWdpbi1lYXNpbmctcXVhZEAzLjkuMS9ub2RlX21vZHVsZXMvQHRzcGFydGljbGVzL3BsdWdpbi1lYXNpbmctcXVhZC9lc20vaW5kZXguanMiLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBaUQ7QUFDMUM7QUFDUDtBQUNBLDJCQUEyQiwyREFBVTtBQUNyQywyQkFBMkIsMkRBQVU7QUFDckMsMkJBQTJCLDJEQUFVO0FBQ3JDO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9teS1wcm9qZWN0Ly4vbm9kZV9tb2R1bGVzLy5wbnBtL0B0c3BhcnRpY2xlcytwbHVnaW4tZWFzaW5nLXF1YWRAMy45LjEvbm9kZV9tb2R1bGVzL0B0c3BhcnRpY2xlcy9wbHVnaW4tZWFzaW5nLXF1YWQvZXNtL2luZGV4LmpzP2FjNTQiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRWFzaW5nVHlwZSB9IGZyb20gXCJAdHNwYXJ0aWNsZXMvZW5naW5lXCI7XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZEVhc2luZ1F1YWRQbHVnaW4oZW5naW5lLCByZWZyZXNoID0gdHJ1ZSkge1xuICAgIGVuZ2luZS5jaGVja1ZlcnNpb24oXCIzLjkuMVwiKTtcbiAgICBhd2FpdCBlbmdpbmUuYWRkRWFzaW5nKEVhc2luZ1R5cGUuZWFzZUluUXVhZCwgdmFsdWUgPT4gdmFsdWUgKiogMiwgZmFsc2UpO1xuICAgIGF3YWl0IGVuZ2luZS5hZGRFYXNpbmcoRWFzaW5nVHlwZS5lYXNlT3V0UXVhZCwgdmFsdWUgPT4gMSAtICgxIC0gdmFsdWUpICoqIDIsIGZhbHNlKTtcbiAgICBhd2FpdCBlbmdpbmUuYWRkRWFzaW5nKEVhc2luZ1R5cGUuZWFzZUluT3V0UXVhZCwgdmFsdWUgPT4gKHZhbHVlIDwgMC41ID8gMiAqIHZhbHVlICoqIDIgOiAxIC0gKC0yICogdmFsdWUgKyAyKSAqKiAyIC8gMiksIGZhbHNlKTtcbiAgICBhd2FpdCBlbmdpbmUucmVmcmVzaChyZWZyZXNoKTtcbn1cbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/.pnpm/@tsparticles+plugin-easing-quad@3.9.1/node_modules/@tsparticles/plugin-easing-quad/esm/index.js\n");

/***/ })

};
;