module.exports = {

"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/map.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Utility module to work with key-value stores.
 *
 * @module map
 */ /**
 * Creates a new Map instance.
 *
 * @function
 * @return {Map<any, any>}
 *
 * @function
 */ __turbopack_context__.s({
    "all": (()=>all),
    "any": (()=>any),
    "copy": (()=>copy),
    "create": (()=>create),
    "map": (()=>map),
    "setIfUndefined": (()=>setIfUndefined)
});
const create = ()=>new Map();
const copy = (m)=>{
    const r = create();
    m.forEach((v, k)=>{
        r.set(k, v);
    });
    return r;
};
const setIfUndefined = (map, key, createT)=>{
    let set = map.get(key);
    if (set === undefined) {
        map.set(key, set = createT());
    }
    return set;
};
const map = (m, f)=>{
    const res = [];
    for (const [key, value] of m){
        res.push(f(value, key));
    }
    return res;
};
const any = (m, f)=>{
    for (const [key, value] of m){
        if (f(value, key)) {
            return true;
        }
    }
    return false;
};
const all = (m, f)=>{
    for (const [key, value] of m){
        if (!f(value, key)) {
            return false;
        }
    }
    return true;
};
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/set.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Utility module to work with sets.
 *
 * @module set
 */ __turbopack_context__.s({
    "create": (()=>create),
    "first": (()=>first),
    "from": (()=>from),
    "toArray": (()=>toArray)
});
const create = ()=>new Set();
const toArray = (set)=>Array.from(set);
const first = (set)=>set.values().next().value ?? undefined;
const from = (entries)=>new Set(entries);
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/array.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Utility module to work with Arrays.
 *
 * @module array
 */ __turbopack_context__.s({
    "appendTo": (()=>appendTo),
    "bubblesortItem": (()=>bubblesortItem),
    "copy": (()=>copy),
    "create": (()=>create),
    "equalFlat": (()=>equalFlat),
    "every": (()=>every),
    "flatten": (()=>flatten),
    "fold": (()=>fold),
    "from": (()=>from),
    "isArray": (()=>isArray),
    "last": (()=>last),
    "map": (()=>map),
    "some": (()=>some),
    "unfold": (()=>unfold),
    "unique": (()=>unique),
    "uniqueBy": (()=>uniqueBy)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$set$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/set.js [app-ssr] (ecmascript)");
;
const last = (arr)=>arr[arr.length - 1];
const create = ()=>[];
const copy = (a)=>a.slice();
const appendTo = (dest, src)=>{
    for(let i = 0; i < src.length; i++){
        dest.push(src[i]);
    }
};
const from = Array.from;
const every = (arr, f)=>{
    for(let i = 0; i < arr.length; i++){
        if (!f(arr[i], i, arr)) {
            return false;
        }
    }
    return true;
};
const some = (arr, f)=>{
    for(let i = 0; i < arr.length; i++){
        if (f(arr[i], i, arr)) {
            return true;
        }
    }
    return false;
};
const equalFlat = (a, b)=>a.length === b.length && every(a, (item, index)=>item === b[index]);
const flatten = (arr)=>fold(arr, [], (acc, val)=>acc.concat(val));
const unfold = (len, f)=>{
    const array = new Array(len);
    for(let i = 0; i < len; i++){
        array[i] = f(i, array);
    }
    return array;
};
const fold = (arr, seed, folder)=>arr.reduce(folder, seed);
const isArray = Array.isArray;
const unique = (arr)=>from((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$set$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["from"])(arr));
const uniqueBy = (arr, mapper)=>{
    /**
   * @type {Set<M>}
   */ const happened = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$set$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])();
    /**
   * @type {Array<T>}
   */ const result = [];
    for(let i = 0; i < arr.length; i++){
        const el = arr[i];
        const mapped = mapper(el);
        if (!happened.has(mapped)) {
            happened.add(mapped);
            result.push(el);
        }
    }
    return result;
};
const map = (arr, mapper)=>{
    /**
   * @type {Array<any>}
   */ const res = Array(arr.length);
    for(let i = 0; i < arr.length; i++){
        res[i] = mapper(arr[i], i, arr);
    }
    return res;
};
const bubblesortItem = (arr, i, compareFn)=>{
    const n = arr[i];
    let j = i;
    // try to sort to the right
    while(j + 1 < arr.length && compareFn(n, arr[j + 1]) > 0){
        arr[j] = arr[j + 1];
        arr[++j] = n;
    }
    if (i === j && j > 0) {
        // sort to the left
        while(j > 0 && compareFn(arr[j - 1], n) > 0){
            arr[j] = arr[j - 1];
            arr[--j] = n;
        }
    }
    return j;
};
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/observable.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Observable class prototype.
 *
 * @module observable
 */ __turbopack_context__.s({
    "Observable": (()=>Observable),
    "ObservableV2": (()=>ObservableV2)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$map$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/map.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$set$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/set.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$array$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/array.js [app-ssr] (ecmascript)");
;
;
;
class ObservableV2 {
    constructor(){
        /**
     * Some desc.
     * @type {Map<string, Set<any>>}
     */ this._observers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$map$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])();
    }
    /**
   * @template {keyof EVENTS & string} NAME
   * @param {NAME} name
   * @param {EVENTS[NAME]} f
   */ on(name, f) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$map$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setIfUndefined"])(this._observers, name, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$set$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"]).add(f);
        return f;
    }
    /**
   * @template {keyof EVENTS & string} NAME
   * @param {NAME} name
   * @param {EVENTS[NAME]} f
   */ once(name, f) {
        /**
     * @param  {...any} args
     */ const _f = (...args)=>{
            this.off(name, _f);
            f(...args);
        };
        this.on(name, _f);
    }
    /**
   * @template {keyof EVENTS & string} NAME
   * @param {NAME} name
   * @param {EVENTS[NAME]} f
   */ off(name, f) {
        const observers = this._observers.get(name);
        if (observers !== undefined) {
            observers.delete(f);
            if (observers.size === 0) {
                this._observers.delete(name);
            }
        }
    }
    /**
   * Emit a named event. All registered event listeners that listen to the
   * specified name will receive the event.
   *
   * @todo This should catch exceptions
   *
   * @template {keyof EVENTS & string} NAME
   * @param {NAME} name The event name.
   * @param {Parameters<EVENTS[NAME]>} args The arguments that are applied to the event listener.
   */ emit(name, args) {
        // copy all listeners to an array first to make sure that no event is emitted to listeners that are subscribed while the event handler is called.
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$array$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["from"])((this._observers.get(name) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$map$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])()).values()).forEach((f)=>f(...args));
    }
    destroy() {
        this._observers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$map$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])();
    }
}
class Observable {
    constructor(){
        /**
     * Some desc.
     * @type {Map<N, any>}
     */ this._observers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$map$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])();
    }
    /**
   * @param {N} name
   * @param {function} f
   */ on(name, f) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$map$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setIfUndefined"])(this._observers, name, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$set$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"]).add(f);
    }
    /**
   * @param {N} name
   * @param {function} f
   */ once(name, f) {
        /**
     * @param  {...any} args
     */ const _f = (...args)=>{
            this.off(name, _f);
            f(...args);
        };
        this.on(name, _f);
    }
    /**
   * @param {N} name
   * @param {function} f
   */ off(name, f) {
        const observers = this._observers.get(name);
        if (observers !== undefined) {
            observers.delete(f);
            if (observers.size === 0) {
                this._observers.delete(name);
            }
        }
    }
    /**
   * Emit a named event. All registered event listeners that listen to the
   * specified name will receive the event.
   *
   * @todo This should catch exceptions
   *
   * @param {N} name The event name.
   * @param {Array<any>} args The arguments that are applied to the event listener.
   */ emit(name, args) {
        // copy all listeners to an array first to make sure that no event is emitted to listeners that are subscribed while the event handler is called.
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$array$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["from"])((this._observers.get(name) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$map$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])()).values()).forEach((f)=>f(...args));
    }
    destroy() {
        this._observers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$map$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])();
    }
} /* c8 ignore end */ 
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/math.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Common Math expressions.
 *
 * @module math
 */ __turbopack_context__.s({
    "abs": (()=>abs),
    "add": (()=>add),
    "ceil": (()=>ceil),
    "exp10": (()=>exp10),
    "floor": (()=>floor),
    "imul": (()=>imul),
    "isNaN": (()=>isNaN),
    "isNegativeZero": (()=>isNegativeZero),
    "log": (()=>log),
    "log10": (()=>log10),
    "log2": (()=>log2),
    "max": (()=>max),
    "min": (()=>min),
    "pow": (()=>pow),
    "round": (()=>round),
    "sign": (()=>sign),
    "sqrt": (()=>sqrt)
});
const floor = Math.floor;
const ceil = Math.ceil;
const abs = Math.abs;
const imul = Math.imul;
const round = Math.round;
const log10 = Math.log10;
const log2 = Math.log2;
const log = Math.log;
const sqrt = Math.sqrt;
const add = (a, b)=>a + b;
const min = (a, b)=>a < b ? a : b;
const max = (a, b)=>a > b ? a : b;
const isNaN = Number.isNaN;
const pow = Math.pow;
const exp10 = (exp)=>Math.pow(10, exp);
const sign = Math.sign;
const isNegativeZero = (n)=>n !== 0 ? n < 0 : 1 / n < 0;
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/binary.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/* eslint-env browser */ /**
 * Binary data constants.
 *
 * @module binary
 */ /**
 * n-th bit activated.
 *
 * @type {number}
 */ __turbopack_context__.s({
    "BIT1": (()=>BIT1),
    "BIT10": (()=>BIT10),
    "BIT11": (()=>BIT11),
    "BIT12": (()=>BIT12),
    "BIT13": (()=>BIT13),
    "BIT14": (()=>BIT14),
    "BIT15": (()=>BIT15),
    "BIT16": (()=>BIT16),
    "BIT17": (()=>BIT17),
    "BIT18": (()=>BIT18),
    "BIT19": (()=>BIT19),
    "BIT2": (()=>BIT2),
    "BIT20": (()=>BIT20),
    "BIT21": (()=>BIT21),
    "BIT22": (()=>BIT22),
    "BIT23": (()=>BIT23),
    "BIT24": (()=>BIT24),
    "BIT25": (()=>BIT25),
    "BIT26": (()=>BIT26),
    "BIT27": (()=>BIT27),
    "BIT28": (()=>BIT28),
    "BIT29": (()=>BIT29),
    "BIT3": (()=>BIT3),
    "BIT30": (()=>BIT30),
    "BIT31": (()=>BIT31),
    "BIT32": (()=>BIT32),
    "BIT4": (()=>BIT4),
    "BIT5": (()=>BIT5),
    "BIT6": (()=>BIT6),
    "BIT7": (()=>BIT7),
    "BIT8": (()=>BIT8),
    "BIT9": (()=>BIT9),
    "BITS0": (()=>BITS0),
    "BITS1": (()=>BITS1),
    "BITS10": (()=>BITS10),
    "BITS11": (()=>BITS11),
    "BITS12": (()=>BITS12),
    "BITS13": (()=>BITS13),
    "BITS14": (()=>BITS14),
    "BITS15": (()=>BITS15),
    "BITS16": (()=>BITS16),
    "BITS17": (()=>BITS17),
    "BITS18": (()=>BITS18),
    "BITS19": (()=>BITS19),
    "BITS2": (()=>BITS2),
    "BITS20": (()=>BITS20),
    "BITS21": (()=>BITS21),
    "BITS22": (()=>BITS22),
    "BITS23": (()=>BITS23),
    "BITS24": (()=>BITS24),
    "BITS25": (()=>BITS25),
    "BITS26": (()=>BITS26),
    "BITS27": (()=>BITS27),
    "BITS28": (()=>BITS28),
    "BITS29": (()=>BITS29),
    "BITS3": (()=>BITS3),
    "BITS30": (()=>BITS30),
    "BITS31": (()=>BITS31),
    "BITS32": (()=>BITS32),
    "BITS4": (()=>BITS4),
    "BITS5": (()=>BITS5),
    "BITS6": (()=>BITS6),
    "BITS7": (()=>BITS7),
    "BITS8": (()=>BITS8),
    "BITS9": (()=>BITS9)
});
const BIT1 = 1;
const BIT2 = 2;
const BIT3 = 4;
const BIT4 = 8;
const BIT5 = 16;
const BIT6 = 32;
const BIT7 = 64;
const BIT8 = 128;
const BIT9 = 256;
const BIT10 = 512;
const BIT11 = 1024;
const BIT12 = 2048;
const BIT13 = 4096;
const BIT14 = 8192;
const BIT15 = 16384;
const BIT16 = 32768;
const BIT17 = 65536;
const BIT18 = 1 << 17;
const BIT19 = 1 << 18;
const BIT20 = 1 << 19;
const BIT21 = 1 << 20;
const BIT22 = 1 << 21;
const BIT23 = 1 << 22;
const BIT24 = 1 << 23;
const BIT25 = 1 << 24;
const BIT26 = 1 << 25;
const BIT27 = 1 << 26;
const BIT28 = 1 << 27;
const BIT29 = 1 << 28;
const BIT30 = 1 << 29;
const BIT31 = 1 << 30;
const BIT32 = 1 << 31;
const BITS0 = 0;
const BITS1 = 1;
const BITS2 = 3;
const BITS3 = 7;
const BITS4 = 15;
const BITS5 = 31;
const BITS6 = 63;
const BITS7 = 127;
const BITS8 = 255;
const BITS9 = 511;
const BITS10 = 1023;
const BITS11 = 2047;
const BITS12 = 4095;
const BITS13 = 8191;
const BITS14 = 16383;
const BITS15 = 32767;
const BITS16 = 65535;
const BITS17 = BIT18 - 1;
const BITS18 = BIT19 - 1;
const BITS19 = BIT20 - 1;
const BITS20 = BIT21 - 1;
const BITS21 = BIT22 - 1;
const BITS22 = BIT23 - 1;
const BITS23 = BIT24 - 1;
const BITS24 = BIT25 - 1;
const BITS25 = BIT26 - 1;
const BITS26 = BIT27 - 1;
const BITS27 = BIT28 - 1;
const BITS28 = BIT29 - 1;
const BITS29 = BIT30 - 1;
const BITS30 = BIT31 - 1;
const BITS31 = 0x7FFFFFFF;
const BITS32 = 0xFFFFFFFF;
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/number.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Utility helpers for working with numbers.
 *
 * @module number
 */ __turbopack_context__.s({
    "HIGHEST_INT32": (()=>HIGHEST_INT32),
    "HIGHEST_UINT32": (()=>HIGHEST_UINT32),
    "LOWEST_INT32": (()=>LOWEST_INT32),
    "MAX_SAFE_INTEGER": (()=>MAX_SAFE_INTEGER),
    "MIN_SAFE_INTEGER": (()=>MIN_SAFE_INTEGER),
    "countBits": (()=>countBits),
    "isInteger": (()=>isInteger),
    "isNaN": (()=>isNaN),
    "parseInt": (()=>parseInt)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/math.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/binary.js [app-ssr] (ecmascript)");
;
;
const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;
const MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER;
const LOWEST_INT32 = 1 << 31;
const HIGHEST_INT32 = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BITS31"];
const HIGHEST_UINT32 = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BITS32"];
const isInteger = Number.isInteger || ((num)=>typeof num === 'number' && isFinite(num) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["floor"])(num) === num);
const isNaN = Number.isNaN;
const parseInt = Number.parseInt;
const countBits = (n)=>{
    n &= __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BITS32"];
    let count = 0;
    while(n){
        n &= n - 1;
        count++;
    }
    return count;
};
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/string.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "MAX_UTF16_CHARACTER": (()=>MAX_UTF16_CHARACTER),
    "_decodeUtf8Native": (()=>_decodeUtf8Native),
    "_decodeUtf8Polyfill": (()=>_decodeUtf8Polyfill),
    "_encodeUtf8Native": (()=>_encodeUtf8Native),
    "_encodeUtf8Polyfill": (()=>_encodeUtf8Polyfill),
    "decodeUtf8": (()=>decodeUtf8),
    "encodeUtf8": (()=>encodeUtf8),
    "escapeHTML": (()=>escapeHTML),
    "fromCamelCase": (()=>fromCamelCase),
    "fromCharCode": (()=>fromCharCode),
    "fromCodePoint": (()=>fromCodePoint),
    "repeat": (()=>repeat),
    "splice": (()=>splice),
    "trimLeft": (()=>trimLeft),
    "unescapeHTML": (()=>unescapeHTML),
    "utf8ByteLength": (()=>utf8ByteLength),
    "utf8TextDecoder": (()=>utf8TextDecoder),
    "utf8TextEncoder": (()=>utf8TextEncoder)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$array$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/array.js [app-ssr] (ecmascript)");
;
const fromCharCode = String.fromCharCode;
const fromCodePoint = String.fromCodePoint;
const MAX_UTF16_CHARACTER = fromCharCode(65535);
/**
 * @param {string} s
 * @return {string}
 */ const toLowerCase = (s)=>s.toLowerCase();
const trimLeftRegex = /^\s*/g;
const trimLeft = (s)=>s.replace(trimLeftRegex, '');
const fromCamelCaseRegex = /([A-Z])/g;
const fromCamelCase = (s, separator)=>trimLeft(s.replace(fromCamelCaseRegex, (match)=>`${separator}${toLowerCase(match)}`));
const utf8ByteLength = (str)=>unescape(encodeURIComponent(str)).length;
const _encodeUtf8Polyfill = (str)=>{
    const encodedString = unescape(encodeURIComponent(str));
    const len = encodedString.length;
    const buf = new Uint8Array(len);
    for(let i = 0; i < len; i++){
        buf[i] = encodedString.codePointAt(i);
    }
    return buf;
};
const utf8TextEncoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
const _encodeUtf8Native = (str)=>utf8TextEncoder.encode(str);
const encodeUtf8 = utf8TextEncoder ? _encodeUtf8Native : _encodeUtf8Polyfill;
const _decodeUtf8Polyfill = (buf)=>{
    let remainingLen = buf.length;
    let encodedString = '';
    let bufPos = 0;
    while(remainingLen > 0){
        const nextLen = remainingLen < 10000 ? remainingLen : 10000;
        const bytes = buf.subarray(bufPos, bufPos + nextLen);
        bufPos += nextLen;
        // Starting with ES5.1 we can supply a generic array-like object as arguments
        encodedString += String.fromCodePoint.apply(null, bytes);
        remainingLen -= nextLen;
    }
    return decodeURIComponent(escape(encodedString));
};
let utf8TextDecoder = typeof TextDecoder === 'undefined' ? null : new TextDecoder('utf-8', {
    fatal: true,
    ignoreBOM: true
});
/* c8 ignore start */ if (utf8TextDecoder && utf8TextDecoder.decode(new Uint8Array()).length === 1) {
    // Safari doesn't handle BOM correctly.
    // This fixes a bug in Safari 13.0.5 where it produces a BOM the first time it is called.
    // utf8TextDecoder.decode(new Uint8Array()).length === 1 on the first call and
    // utf8TextDecoder.decode(new Uint8Array()).length === 1 on the second call
    // Another issue is that from then on no BOM chars are recognized anymore
    /* c8 ignore next */ utf8TextDecoder = null;
}
const _decodeUtf8Native = (buf)=>/** @type {TextDecoder} */ utf8TextDecoder.decode(buf);
const decodeUtf8 = utf8TextDecoder ? _decodeUtf8Native : _decodeUtf8Polyfill;
const splice = (str, index, remove, insert = '')=>str.slice(0, index) + insert + str.slice(index + remove);
const repeat = (source, n)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$array$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["unfold"])(n, ()=>source).join('');
const escapeHTML = (str)=>str.replace(/[&<>'"]/g, (r)=>({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        })[r]);
const unescapeHTML = (str)=>str.replace(/&amp;|&lt;|&gt;|&#39;|&quot;/g, (r)=>({
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&#39;': "'",
            '&quot;': '"'
        })[r]);
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/encoding.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Efficient schema-less binary encoding with support for variable length encoding.
 *
 * Use [lib0/encoding] with [lib0/decoding]. Every encoding function has a corresponding decoding function.
 *
 * Encodes numbers in little-endian order (least to most significant byte order)
 * and is compatible with Golang's binary encoding (https://golang.org/pkg/encoding/binary/)
 * which is also used in Protocol Buffers.
 *
 * ```js
 * // encoding step
 * const encoder = encoding.createEncoder()
 * encoding.writeVarUint(encoder, 256)
 * encoding.writeVarString(encoder, 'Hello world!')
 * const buf = encoding.toUint8Array(encoder)
 * ```
 *
 * ```js
 * // decoding step
 * const decoder = decoding.createDecoder(buf)
 * decoding.readVarUint(decoder) // => 256
 * decoding.readVarString(decoder) // => 'Hello world!'
 * decoding.hasContent(decoder) // => false - all data is read
 * ```
 *
 * @module encoding
 */ __turbopack_context__.s({
    "Encoder": (()=>Encoder),
    "IncUintOptRleEncoder": (()=>IncUintOptRleEncoder),
    "IntDiffEncoder": (()=>IntDiffEncoder),
    "IntDiffOptRleEncoder": (()=>IntDiffOptRleEncoder),
    "RleEncoder": (()=>RleEncoder),
    "RleIntDiffEncoder": (()=>RleIntDiffEncoder),
    "StringEncoder": (()=>StringEncoder),
    "UintOptRleEncoder": (()=>UintOptRleEncoder),
    "_writeVarStringNative": (()=>_writeVarStringNative),
    "_writeVarStringPolyfill": (()=>_writeVarStringPolyfill),
    "createEncoder": (()=>createEncoder),
    "encode": (()=>encode),
    "hasContent": (()=>hasContent),
    "length": (()=>length),
    "set": (()=>set),
    "setUint16": (()=>setUint16),
    "setUint32": (()=>setUint32),
    "setUint8": (()=>setUint8),
    "toUint8Array": (()=>toUint8Array),
    "verifyLen": (()=>verifyLen),
    "write": (()=>write),
    "writeAny": (()=>writeAny),
    "writeBigInt64": (()=>writeBigInt64),
    "writeBigUint64": (()=>writeBigUint64),
    "writeBinaryEncoder": (()=>writeBinaryEncoder),
    "writeFloat32": (()=>writeFloat32),
    "writeFloat64": (()=>writeFloat64),
    "writeOnDataView": (()=>writeOnDataView),
    "writeTerminatedString": (()=>writeTerminatedString),
    "writeTerminatedUint8Array": (()=>writeTerminatedUint8Array),
    "writeUint16": (()=>writeUint16),
    "writeUint32": (()=>writeUint32),
    "writeUint32BigEndian": (()=>writeUint32BigEndian),
    "writeUint8": (()=>writeUint8),
    "writeUint8Array": (()=>writeUint8Array),
    "writeVarInt": (()=>writeVarInt),
    "writeVarString": (()=>writeVarString),
    "writeVarUint": (()=>writeVarUint),
    "writeVarUint8Array": (()=>writeVarUint8Array)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/math.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$number$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/number.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/binary.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$string$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/string.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$array$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/array.js [app-ssr] (ecmascript)");
;
;
;
;
;
class Encoder {
    constructor(){
        this.cpos = 0;
        this.cbuf = new Uint8Array(100);
        /**
     * @type {Array<Uint8Array>}
     */ this.bufs = [];
    }
}
const createEncoder = ()=>new Encoder();
const encode = (f)=>{
    const encoder = createEncoder();
    f(encoder);
    return toUint8Array(encoder);
};
const length = (encoder)=>{
    let len = encoder.cpos;
    for(let i = 0; i < encoder.bufs.length; i++){
        len += encoder.bufs[i].length;
    }
    return len;
};
const hasContent = (encoder)=>encoder.cpos > 0 || encoder.bufs.length > 0;
const toUint8Array = (encoder)=>{
    const uint8arr = new Uint8Array(length(encoder));
    let curPos = 0;
    for(let i = 0; i < encoder.bufs.length; i++){
        const d = encoder.bufs[i];
        uint8arr.set(d, curPos);
        curPos += d.length;
    }
    uint8arr.set(new Uint8Array(encoder.cbuf.buffer, 0, encoder.cpos), curPos);
    return uint8arr;
};
const verifyLen = (encoder, len)=>{
    const bufferLen = encoder.cbuf.length;
    if (bufferLen - encoder.cpos < len) {
        encoder.bufs.push(new Uint8Array(encoder.cbuf.buffer, 0, encoder.cpos));
        encoder.cbuf = new Uint8Array((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["max"])(bufferLen, len) * 2);
        encoder.cpos = 0;
    }
};
const write = (encoder, num)=>{
    const bufferLen = encoder.cbuf.length;
    if (encoder.cpos === bufferLen) {
        encoder.bufs.push(encoder.cbuf);
        encoder.cbuf = new Uint8Array(bufferLen * 2);
        encoder.cpos = 0;
    }
    encoder.cbuf[encoder.cpos++] = num;
};
const set = (encoder, pos, num)=>{
    let buffer = null;
    // iterate all buffers and adjust position
    for(let i = 0; i < encoder.bufs.length && buffer === null; i++){
        const b = encoder.bufs[i];
        if (pos < b.length) {
            buffer = b // found buffer
            ;
        } else {
            pos -= b.length;
        }
    }
    if (buffer === null) {
        // use current buffer
        buffer = encoder.cbuf;
    }
    buffer[pos] = num;
};
const writeUint8 = write;
const setUint8 = set;
const writeUint16 = (encoder, num)=>{
    write(encoder, num & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BITS8"]);
    write(encoder, num >>> 8 & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BITS8"]);
};
const setUint16 = (encoder, pos, num)=>{
    set(encoder, pos, num & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BITS8"]);
    set(encoder, pos + 1, num >>> 8 & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BITS8"]);
};
const writeUint32 = (encoder, num)=>{
    for(let i = 0; i < 4; i++){
        write(encoder, num & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BITS8"]);
        num >>>= 8;
    }
};
const writeUint32BigEndian = (encoder, num)=>{
    for(let i = 3; i >= 0; i--){
        write(encoder, num >>> 8 * i & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BITS8"]);
    }
};
const setUint32 = (encoder, pos, num)=>{
    for(let i = 0; i < 4; i++){
        set(encoder, pos + i, num & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BITS8"]);
        num >>>= 8;
    }
};
const writeVarUint = (encoder, num)=>{
    while(num > __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BITS7"]){
        write(encoder, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BIT8"] | __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BITS7"] & num);
        num = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["floor"])(num / 128) // shift >>> 7
        ;
    }
    write(encoder, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BITS7"] & num);
};
const writeVarInt = (encoder, num)=>{
    const isNegative = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNegativeZero"])(num);
    if (isNegative) {
        num = -num;
    }
    //             |- whether to continue reading         |- whether is negative     |- number
    write(encoder, (num > __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BITS6"] ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BIT8"] : 0) | (isNegative ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BIT7"] : 0) | __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BITS6"] & num);
    num = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["floor"])(num / 64) // shift >>> 6
    ;
    // We don't need to consider the case of num === 0 so we can use a different
    // pattern here than above.
    while(num > 0){
        write(encoder, (num > __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BITS7"] ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BIT8"] : 0) | __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BITS7"] & num);
        num = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["floor"])(num / 128) // shift >>> 7
        ;
    }
};
/**
 * A cache to store strings temporarily
 */ const _strBuffer = new Uint8Array(30000);
const _maxStrBSize = _strBuffer.length / 3;
const _writeVarStringNative = (encoder, str)=>{
    if (str.length < _maxStrBSize) {
        // We can encode the string into the existing buffer
        /* c8 ignore next */ const written = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$string$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["utf8TextEncoder"].encodeInto(str, _strBuffer).written || 0;
        writeVarUint(encoder, written);
        for(let i = 0; i < written; i++){
            write(encoder, _strBuffer[i]);
        }
    } else {
        writeVarUint8Array(encoder, (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$string$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["encodeUtf8"])(str));
    }
};
const _writeVarStringPolyfill = (encoder, str)=>{
    const encodedString = unescape(encodeURIComponent(str));
    const len = encodedString.length;
    writeVarUint(encoder, len);
    for(let i = 0; i < len; i++){
        write(encoder, encodedString.codePointAt(i));
    }
};
const writeVarString = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$string$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["utf8TextEncoder"] && /** @type {any} */ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$string$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["utf8TextEncoder"].encodeInto ? _writeVarStringNative : _writeVarStringPolyfill;
const writeTerminatedString = (encoder, str)=>writeTerminatedUint8Array(encoder, (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$string$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["encodeUtf8"])(str));
const writeTerminatedUint8Array = (encoder, buf)=>{
    for(let i = 0; i < buf.length; i++){
        const b = buf[i];
        if (b === 0 || b === 1) {
            write(encoder, 1);
        }
        write(encoder, buf[i]);
    }
    write(encoder, 0);
};
const writeBinaryEncoder = (encoder, append)=>writeUint8Array(encoder, toUint8Array(append));
const writeUint8Array = (encoder, uint8Array)=>{
    const bufferLen = encoder.cbuf.length;
    const cpos = encoder.cpos;
    const leftCopyLen = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["min"])(bufferLen - cpos, uint8Array.length);
    const rightCopyLen = uint8Array.length - leftCopyLen;
    encoder.cbuf.set(uint8Array.subarray(0, leftCopyLen), cpos);
    encoder.cpos += leftCopyLen;
    if (rightCopyLen > 0) {
        // Still something to write, write right half..
        // Append new buffer
        encoder.bufs.push(encoder.cbuf);
        // must have at least size of remaining buffer
        encoder.cbuf = new Uint8Array((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["max"])(bufferLen * 2, rightCopyLen));
        // copy array
        encoder.cbuf.set(uint8Array.subarray(leftCopyLen));
        encoder.cpos = rightCopyLen;
    }
};
const writeVarUint8Array = (encoder, uint8Array)=>{
    writeVarUint(encoder, uint8Array.byteLength);
    writeUint8Array(encoder, uint8Array);
};
const writeOnDataView = (encoder, len)=>{
    verifyLen(encoder, len);
    const dview = new DataView(encoder.cbuf.buffer, encoder.cpos, len);
    encoder.cpos += len;
    return dview;
};
const writeFloat32 = (encoder, num)=>writeOnDataView(encoder, 4).setFloat32(0, num, false);
const writeFloat64 = (encoder, num)=>writeOnDataView(encoder, 8).setFloat64(0, num, false);
const writeBigInt64 = (encoder, num)=>/** @type {any} */ writeOnDataView(encoder, 8).setBigInt64(0, num, false);
const writeBigUint64 = (encoder, num)=>/** @type {any} */ writeOnDataView(encoder, 8).setBigUint64(0, num, false);
const floatTestBed = new DataView(new ArrayBuffer(4));
/**
 * Check if a number can be encoded as a 32 bit float.
 *
 * @param {number} num
 * @return {boolean}
 */ const isFloat32 = (num)=>{
    floatTestBed.setFloat32(0, num);
    return floatTestBed.getFloat32(0) === num;
};
const writeAny = (encoder, data)=>{
    switch(typeof data){
        case 'string':
            // TYPE 119: STRING
            write(encoder, 119);
            writeVarString(encoder, data);
            break;
        case 'number':
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$number$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isInteger"])(data) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["abs"])(data) <= __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BITS31"]) {
                // TYPE 125: INTEGER
                write(encoder, 125);
                writeVarInt(encoder, data);
            } else if (isFloat32(data)) {
                // TYPE 124: FLOAT32
                write(encoder, 124);
                writeFloat32(encoder, data);
            } else {
                // TYPE 123: FLOAT64
                write(encoder, 123);
                writeFloat64(encoder, data);
            }
            break;
        case 'bigint':
            // TYPE 122: BigInt
            write(encoder, 122);
            writeBigInt64(encoder, data);
            break;
        case 'object':
            if (data === null) {
                // TYPE 126: null
                write(encoder, 126);
            } else if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$array$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isArray"])(data)) {
                // TYPE 117: Array
                write(encoder, 117);
                writeVarUint(encoder, data.length);
                for(let i = 0; i < data.length; i++){
                    writeAny(encoder, data[i]);
                }
            } else if (data instanceof Uint8Array) {
                // TYPE 116: ArrayBuffer
                write(encoder, 116);
                writeVarUint8Array(encoder, data);
            } else {
                // TYPE 118: Object
                write(encoder, 118);
                const keys = Object.keys(data);
                writeVarUint(encoder, keys.length);
                for(let i = 0; i < keys.length; i++){
                    const key = keys[i];
                    writeVarString(encoder, key);
                    writeAny(encoder, data[key]);
                }
            }
            break;
        case 'boolean':
            // TYPE 120/121: boolean (true/false)
            write(encoder, data ? 120 : 121);
            break;
        default:
            // TYPE 127: undefined
            write(encoder, 127);
    }
};
class RleEncoder extends Encoder {
    /**
   * @param {function(Encoder, T):void} writer
   */ constructor(writer){
        super();
        /**
     * The writer
     */ this.w = writer;
        /**
     * Current state
     * @type {T|null}
     */ this.s = null;
        this.count = 0;
    }
    /**
   * @param {T} v
   */ write(v) {
        if (this.s === v) {
            this.count++;
        } else {
            if (this.count > 0) {
                // flush counter, unless this is the first value (count = 0)
                writeVarUint(this, this.count - 1) // since count is always > 0, we can decrement by one. non-standard encoding ftw
                ;
            }
            this.count = 1;
            // write first value
            this.w(this, v);
            this.s = v;
        }
    }
}
class IntDiffEncoder extends Encoder {
    /**
   * @param {number} start
   */ constructor(start){
        super();
        /**
     * Current state
     * @type {number}
     */ this.s = start;
    }
    /**
   * @param {number} v
   */ write(v) {
        writeVarInt(this, v - this.s);
        this.s = v;
    }
}
class RleIntDiffEncoder extends Encoder {
    /**
   * @param {number} start
   */ constructor(start){
        super();
        /**
     * Current state
     * @type {number}
     */ this.s = start;
        this.count = 0;
    }
    /**
   * @param {number} v
   */ write(v) {
        if (this.s === v && this.count > 0) {
            this.count++;
        } else {
            if (this.count > 0) {
                // flush counter, unless this is the first value (count = 0)
                writeVarUint(this, this.count - 1) // since count is always > 0, we can decrement by one. non-standard encoding ftw
                ;
            }
            this.count = 1;
            // write first value
            writeVarInt(this, v - this.s);
            this.s = v;
        }
    }
}
/**
 * @param {UintOptRleEncoder} encoder
 */ const flushUintOptRleEncoder = (encoder)=>{
    if (encoder.count > 0) {
        // flush counter, unless this is the first value (count = 0)
        // case 1: just a single value. set sign to positive
        // case 2: write several values. set sign to negative to indicate that there is a length coming
        writeVarInt(encoder.encoder, encoder.count === 1 ? encoder.s : -encoder.s);
        if (encoder.count > 1) {
            writeVarUint(encoder.encoder, encoder.count - 2) // since count is always > 1, we can decrement by one. non-standard encoding ftw
            ;
        }
    }
};
class UintOptRleEncoder {
    constructor(){
        this.encoder = new Encoder();
        /**
     * @type {number}
     */ this.s = 0;
        this.count = 0;
    }
    /**
   * @param {number} v
   */ write(v) {
        if (this.s === v) {
            this.count++;
        } else {
            flushUintOptRleEncoder(this);
            this.count = 1;
            this.s = v;
        }
    }
    /**
   * Flush the encoded state and transform this to a Uint8Array.
   *
   * Note that this should only be called once.
   */ toUint8Array() {
        flushUintOptRleEncoder(this);
        return toUint8Array(this.encoder);
    }
}
class IncUintOptRleEncoder {
    constructor(){
        this.encoder = new Encoder();
        /**
     * @type {number}
     */ this.s = 0;
        this.count = 0;
    }
    /**
   * @param {number} v
   */ write(v) {
        if (this.s + this.count === v) {
            this.count++;
        } else {
            flushUintOptRleEncoder(this);
            this.count = 1;
            this.s = v;
        }
    }
    /**
   * Flush the encoded state and transform this to a Uint8Array.
   *
   * Note that this should only be called once.
   */ toUint8Array() {
        flushUintOptRleEncoder(this);
        return toUint8Array(this.encoder);
    }
}
/**
 * @param {IntDiffOptRleEncoder} encoder
 */ const flushIntDiffOptRleEncoder = (encoder)=>{
    if (encoder.count > 0) {
        //          31 bit making up the diff | wether to write the counter
        // const encodedDiff = encoder.diff << 1 | (encoder.count === 1 ? 0 : 1)
        const encodedDiff = encoder.diff * 2 + (encoder.count === 1 ? 0 : 1);
        // flush counter, unless this is the first value (count = 0)
        // case 1: just a single value. set first bit to positive
        // case 2: write several values. set first bit to negative to indicate that there is a length coming
        writeVarInt(encoder.encoder, encodedDiff);
        if (encoder.count > 1) {
            writeVarUint(encoder.encoder, encoder.count - 2) // since count is always > 1, we can decrement by one. non-standard encoding ftw
            ;
        }
    }
};
class IntDiffOptRleEncoder {
    constructor(){
        this.encoder = new Encoder();
        /**
     * @type {number}
     */ this.s = 0;
        this.count = 0;
        this.diff = 0;
    }
    /**
   * @param {number} v
   */ write(v) {
        if (this.diff === v - this.s) {
            this.s = v;
            this.count++;
        } else {
            flushIntDiffOptRleEncoder(this);
            this.count = 1;
            this.diff = v - this.s;
            this.s = v;
        }
    }
    /**
   * Flush the encoded state and transform this to a Uint8Array.
   *
   * Note that this should only be called once.
   */ toUint8Array() {
        flushIntDiffOptRleEncoder(this);
        return toUint8Array(this.encoder);
    }
}
class StringEncoder {
    constructor(){
        /**
     * @type {Array<string>}
     */ this.sarr = [];
        this.s = '';
        this.lensE = new UintOptRleEncoder();
    }
    /**
   * @param {string} string
   */ write(string) {
        this.s += string;
        if (this.s.length > 19) {
            this.sarr.push(this.s);
            this.s = '';
        }
        this.lensE.write(string.length);
    }
    toUint8Array() {
        const encoder = new Encoder();
        this.sarr.push(this.s);
        this.s = '';
        writeVarString(encoder, this.sarr.join(''));
        writeUint8Array(encoder, this.lensE.toUint8Array());
        return toUint8Array(encoder);
    }
}
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/error.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Error helpers.
 *
 * @module error
 */ /**
 * @param {string} s
 * @return {Error}
 */ /* c8 ignore next */ __turbopack_context__.s({
    "create": (()=>create),
    "methodUnimplemented": (()=>methodUnimplemented),
    "unexpectedCase": (()=>unexpectedCase)
});
const create = (s)=>new Error(s);
const methodUnimplemented = ()=>{
    throw create('Method unimplemented');
};
const unexpectedCase = ()=>{
    throw create('Unexpected case');
};
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/decoding.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Efficient schema-less binary decoding with support for variable length encoding.
 *
 * Use [lib0/decoding] with [lib0/encoding]. Every encoding function has a corresponding decoding function.
 *
 * Encodes numbers in little-endian order (least to most significant byte order)
 * and is compatible with Golang's binary encoding (https://golang.org/pkg/encoding/binary/)
 * which is also used in Protocol Buffers.
 *
 * ```js
 * // encoding step
 * const encoder = encoding.createEncoder()
 * encoding.writeVarUint(encoder, 256)
 * encoding.writeVarString(encoder, 'Hello world!')
 * const buf = encoding.toUint8Array(encoder)
 * ```
 *
 * ```js
 * // decoding step
 * const decoder = decoding.createDecoder(buf)
 * decoding.readVarUint(decoder) // => 256
 * decoding.readVarString(decoder) // => 'Hello world!'
 * decoding.hasContent(decoder) // => false - all data is read
 * ```
 *
 * @module decoding
 */ __turbopack_context__.s({
    "Decoder": (()=>Decoder),
    "IncUintOptRleDecoder": (()=>IncUintOptRleDecoder),
    "IntDiffDecoder": (()=>IntDiffDecoder),
    "IntDiffOptRleDecoder": (()=>IntDiffOptRleDecoder),
    "RleDecoder": (()=>RleDecoder),
    "RleIntDiffDecoder": (()=>RleIntDiffDecoder),
    "StringDecoder": (()=>StringDecoder),
    "UintOptRleDecoder": (()=>UintOptRleDecoder),
    "_readVarStringNative": (()=>_readVarStringNative),
    "_readVarStringPolyfill": (()=>_readVarStringPolyfill),
    "clone": (()=>clone),
    "createDecoder": (()=>createDecoder),
    "hasContent": (()=>hasContent),
    "peekUint16": (()=>peekUint16),
    "peekUint32": (()=>peekUint32),
    "peekUint8": (()=>peekUint8),
    "peekVarInt": (()=>peekVarInt),
    "peekVarString": (()=>peekVarString),
    "peekVarUint": (()=>peekVarUint),
    "readAny": (()=>readAny),
    "readBigInt64": (()=>readBigInt64),
    "readBigUint64": (()=>readBigUint64),
    "readFloat32": (()=>readFloat32),
    "readFloat64": (()=>readFloat64),
    "readFromDataView": (()=>readFromDataView),
    "readTailAsUint8Array": (()=>readTailAsUint8Array),
    "readTerminatedString": (()=>readTerminatedString),
    "readTerminatedUint8Array": (()=>readTerminatedUint8Array),
    "readUint16": (()=>readUint16),
    "readUint32": (()=>readUint32),
    "readUint32BigEndian": (()=>readUint32BigEndian),
    "readUint8": (()=>readUint8),
    "readUint8Array": (()=>readUint8Array),
    "readVarInt": (()=>readVarInt),
    "readVarString": (()=>readVarString),
    "readVarUint": (()=>readVarUint),
    "readVarUint8Array": (()=>readVarUint8Array),
    "skip8": (()=>skip8)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/binary.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/math.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$number$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/number.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$string$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/string.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$error$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/error.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$encoding$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/encoding.js [app-ssr] (ecmascript)");
;
;
;
;
;
;
const errorUnexpectedEndOfArray = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$error$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])('Unexpected end of array');
const errorIntegerOutOfRange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$error$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])('Integer out of Range');
class Decoder {
    /**
   * @param {Uint8Array} uint8Array Binary data to decode
   */ constructor(uint8Array){
        /**
     * Decoding target.
     *
     * @type {Uint8Array}
     */ this.arr = uint8Array;
        /**
     * Current decoding position.
     *
     * @type {number}
     */ this.pos = 0;
    }
}
const createDecoder = (uint8Array)=>new Decoder(uint8Array);
const hasContent = (decoder)=>decoder.pos !== decoder.arr.length;
const clone = (decoder, newPos = decoder.pos)=>{
    const _decoder = createDecoder(decoder.arr);
    _decoder.pos = newPos;
    return _decoder;
};
const readUint8Array = (decoder, len)=>{
    const view = new Uint8Array(decoder.arr.buffer, decoder.pos + decoder.arr.byteOffset, len);
    decoder.pos += len;
    return view;
};
const readVarUint8Array = (decoder)=>readUint8Array(decoder, readVarUint(decoder));
const readTailAsUint8Array = (decoder)=>readUint8Array(decoder, decoder.arr.length - decoder.pos);
const skip8 = (decoder)=>decoder.pos++;
const readUint8 = (decoder)=>decoder.arr[decoder.pos++];
const readUint16 = (decoder)=>{
    const uint = decoder.arr[decoder.pos] + (decoder.arr[decoder.pos + 1] << 8);
    decoder.pos += 2;
    return uint;
};
const readUint32 = (decoder)=>{
    const uint = decoder.arr[decoder.pos] + (decoder.arr[decoder.pos + 1] << 8) + (decoder.arr[decoder.pos + 2] << 16) + (decoder.arr[decoder.pos + 3] << 24) >>> 0;
    decoder.pos += 4;
    return uint;
};
const readUint32BigEndian = (decoder)=>{
    const uint = decoder.arr[decoder.pos + 3] + (decoder.arr[decoder.pos + 2] << 8) + (decoder.arr[decoder.pos + 1] << 16) + (decoder.arr[decoder.pos] << 24) >>> 0;
    decoder.pos += 4;
    return uint;
};
const peekUint8 = (decoder)=>decoder.arr[decoder.pos];
const peekUint16 = (decoder)=>decoder.arr[decoder.pos] + (decoder.arr[decoder.pos + 1] << 8);
const peekUint32 = (decoder)=>decoder.arr[decoder.pos] + (decoder.arr[decoder.pos + 1] << 8) + (decoder.arr[decoder.pos + 2] << 16) + (decoder.arr[decoder.pos + 3] << 24) >>> 0;
const readVarUint = (decoder)=>{
    let num = 0;
    let mult = 1;
    const len = decoder.arr.length;
    while(decoder.pos < len){
        const r = decoder.arr[decoder.pos++];
        // num = num | ((r & binary.BITS7) << len)
        num = num + (r & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BITS7"]) * mult // shift $r << (7*#iterations) and add it to num
        ;
        mult *= 128 // next iteration, shift 7 "more" to the left
        ;
        if (r < __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BIT8"]) {
            return num;
        }
        /* c8 ignore start */ if (num > __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$number$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MAX_SAFE_INTEGER"]) {
            throw errorIntegerOutOfRange;
        }
    /* c8 ignore stop */ }
    throw errorUnexpectedEndOfArray;
};
const readVarInt = (decoder)=>{
    let r = decoder.arr[decoder.pos++];
    let num = r & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BITS6"];
    let mult = 64;
    const sign = (r & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BIT7"]) > 0 ? -1 : 1;
    if ((r & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BIT8"]) === 0) {
        // don't continue reading
        return sign * num;
    }
    const len = decoder.arr.length;
    while(decoder.pos < len){
        r = decoder.arr[decoder.pos++];
        // num = num | ((r & binary.BITS7) << len)
        num = num + (r & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BITS7"]) * mult;
        mult *= 128;
        if (r < __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BIT8"]) {
            return sign * num;
        }
        /* c8 ignore start */ if (num > __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$number$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MAX_SAFE_INTEGER"]) {
            throw errorIntegerOutOfRange;
        }
    /* c8 ignore stop */ }
    throw errorUnexpectedEndOfArray;
};
const peekVarUint = (decoder)=>{
    const pos = decoder.pos;
    const s = readVarUint(decoder);
    decoder.pos = pos;
    return s;
};
const peekVarInt = (decoder)=>{
    const pos = decoder.pos;
    const s = readVarInt(decoder);
    decoder.pos = pos;
    return s;
};
const _readVarStringPolyfill = (decoder)=>{
    let remainingLen = readVarUint(decoder);
    if (remainingLen === 0) {
        return '';
    } else {
        let encodedString = String.fromCodePoint(readUint8(decoder)) // remember to decrease remainingLen
        ;
        if (--remainingLen < 100) {
            while(remainingLen--){
                encodedString += String.fromCodePoint(readUint8(decoder));
            }
        } else {
            while(remainingLen > 0){
                const nextLen = remainingLen < 10000 ? remainingLen : 10000;
                // this is dangerous, we create a fresh array view from the existing buffer
                const bytes = decoder.arr.subarray(decoder.pos, decoder.pos + nextLen);
                decoder.pos += nextLen;
                // Starting with ES5.1 we can supply a generic array-like object as arguments
                encodedString += String.fromCodePoint.apply(null, bytes);
                remainingLen -= nextLen;
            }
        }
        return decodeURIComponent(escape(encodedString));
    }
};
const _readVarStringNative = (decoder)=>/** @type any */ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$string$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["utf8TextDecoder"].decode(readVarUint8Array(decoder));
const readVarString = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$string$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["utf8TextDecoder"] ? _readVarStringNative : _readVarStringPolyfill;
const readTerminatedUint8Array = (decoder)=>{
    const encoder = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$encoding$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createEncoder"])();
    let b;
    while(true){
        b = readUint8(decoder);
        if (b === 0) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$encoding$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toUint8Array"])(encoder);
        }
        if (b === 1) {
            b = readUint8(decoder);
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$encoding$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["write"])(encoder, b);
    }
};
const readTerminatedString = (decoder)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$string$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["decodeUtf8"])(readTerminatedUint8Array(decoder));
const peekVarString = (decoder)=>{
    const pos = decoder.pos;
    const s = readVarString(decoder);
    decoder.pos = pos;
    return s;
};
const readFromDataView = (decoder, len)=>{
    const dv = new DataView(decoder.arr.buffer, decoder.arr.byteOffset + decoder.pos, len);
    decoder.pos += len;
    return dv;
};
const readFloat32 = (decoder)=>readFromDataView(decoder, 4).getFloat32(0, false);
const readFloat64 = (decoder)=>readFromDataView(decoder, 8).getFloat64(0, false);
const readBigInt64 = (decoder)=>/** @type {any} */ readFromDataView(decoder, 8).getBigInt64(0, false);
const readBigUint64 = (decoder)=>/** @type {any} */ readFromDataView(decoder, 8).getBigUint64(0, false);
/**
 * @type {Array<function(Decoder):any>}
 */ const readAnyLookupTable = [
    (decoder)=>undefined,
    (decoder)=>null,
    readVarInt,
    readFloat32,
    readFloat64,
    readBigInt64,
    (decoder)=>false,
    (decoder)=>true,
    readVarString,
    (decoder)=>{
        const len = readVarUint(decoder);
        /**
     * @type {Object<string,any>}
     */ const obj = {};
        for(let i = 0; i < len; i++){
            const key = readVarString(decoder);
            obj[key] = readAny(decoder);
        }
        return obj;
    },
    (decoder)=>{
        const len = readVarUint(decoder);
        const arr = [];
        for(let i = 0; i < len; i++){
            arr.push(readAny(decoder));
        }
        return arr;
    },
    readVarUint8Array // CASE 116: Uint8Array
];
const readAny = (decoder)=>readAnyLookupTable[127 - readUint8(decoder)](decoder);
class RleDecoder extends Decoder {
    /**
   * @param {Uint8Array} uint8Array
   * @param {function(Decoder):T} reader
   */ constructor(uint8Array, reader){
        super(uint8Array);
        /**
     * The reader
     */ this.reader = reader;
        /**
     * Current state
     * @type {T|null}
     */ this.s = null;
        this.count = 0;
    }
    read() {
        if (this.count === 0) {
            this.s = this.reader(this);
            if (hasContent(this)) {
                this.count = readVarUint(this) + 1 // see encoder implementation for the reason why this is incremented
                ;
            } else {
                this.count = -1 // read the current value forever
                ;
            }
        }
        this.count--;
        return this.s;
    }
}
class IntDiffDecoder extends Decoder {
    /**
   * @param {Uint8Array} uint8Array
   * @param {number} start
   */ constructor(uint8Array, start){
        super(uint8Array);
        /**
     * Current state
     * @type {number}
     */ this.s = start;
    }
    /**
   * @return {number}
   */ read() {
        this.s += readVarInt(this);
        return this.s;
    }
}
class RleIntDiffDecoder extends Decoder {
    /**
   * @param {Uint8Array} uint8Array
   * @param {number} start
   */ constructor(uint8Array, start){
        super(uint8Array);
        /**
     * Current state
     * @type {number}
     */ this.s = start;
        this.count = 0;
    }
    /**
   * @return {number}
   */ read() {
        if (this.count === 0) {
            this.s += readVarInt(this);
            if (hasContent(this)) {
                this.count = readVarUint(this) + 1 // see encoder implementation for the reason why this is incremented
                ;
            } else {
                this.count = -1 // read the current value forever
                ;
            }
        }
        this.count--;
        return this.s;
    }
}
class UintOptRleDecoder extends Decoder {
    /**
   * @param {Uint8Array} uint8Array
   */ constructor(uint8Array){
        super(uint8Array);
        /**
     * @type {number}
     */ this.s = 0;
        this.count = 0;
    }
    read() {
        if (this.count === 0) {
            this.s = readVarInt(this);
            // if the sign is negative, we read the count too, otherwise count is 1
            const isNegative = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNegativeZero"])(this.s);
            this.count = 1;
            if (isNegative) {
                this.s = -this.s;
                this.count = readVarUint(this) + 2;
            }
        }
        this.count--;
        return this.s;
    }
}
class IncUintOptRleDecoder extends Decoder {
    /**
   * @param {Uint8Array} uint8Array
   */ constructor(uint8Array){
        super(uint8Array);
        /**
     * @type {number}
     */ this.s = 0;
        this.count = 0;
    }
    read() {
        if (this.count === 0) {
            this.s = readVarInt(this);
            // if the sign is negative, we read the count too, otherwise count is 1
            const isNegative = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNegativeZero"])(this.s);
            this.count = 1;
            if (isNegative) {
                this.s = -this.s;
                this.count = readVarUint(this) + 2;
            }
        }
        this.count--;
        return this.s++;
    }
}
class IntDiffOptRleDecoder extends Decoder {
    /**
   * @param {Uint8Array} uint8Array
   */ constructor(uint8Array){
        super(uint8Array);
        /**
     * @type {number}
     */ this.s = 0;
        this.count = 0;
        this.diff = 0;
    }
    /**
   * @return {number}
   */ read() {
        if (this.count === 0) {
            const diff = readVarInt(this);
            // if the first bit is set, we read more data
            const hasCount = diff & 1;
            this.diff = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["floor"])(diff / 2) // shift >> 1
            ;
            this.count = 1;
            if (hasCount) {
                this.count = readVarUint(this) + 2;
            }
        }
        this.s += this.diff;
        this.count--;
        return this.s;
    }
}
class StringDecoder {
    /**
   * @param {Uint8Array} uint8Array
   */ constructor(uint8Array){
        this.decoder = new UintOptRleDecoder(uint8Array);
        this.str = readVarString(this.decoder);
        /**
     * @type {number}
     */ this.spos = 0;
    }
    /**
   * @return {string}
   */ read() {
        const end = this.spos + this.decoder.read();
        const res = this.str.slice(this.spos, end);
        this.spos = end;
        return res;
    }
}
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/webcrypto.node.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "getRandomValues": (()=>getRandomValues),
    "subtle": (()=>subtle)
});
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
;
const subtle = /** @type {any} */ __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["webcrypto"].subtle;
const getRandomValues = /** @type {any} */ __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["webcrypto"].getRandomValues.bind(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["webcrypto"]);
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/random.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Isomorphic module for true random numbers / buffers / uuids.
 *
 * Attention: falls back to Math.random if the browser does not support crypto.
 *
 * @module random
 */ __turbopack_context__.s({
    "oneOf": (()=>oneOf),
    "rand": (()=>rand),
    "uint32": (()=>uint32),
    "uint53": (()=>uint53),
    "uuidv4": (()=>uuidv4)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/math.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/binary.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$webcrypto$2e$node$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/webcrypto.node.js [app-ssr] (ecmascript)");
;
;
;
const rand = Math.random;
const uint32 = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$webcrypto$2e$node$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getRandomValues"])(new Uint32Array(1))[0];
const uint53 = ()=>{
    const arr = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$webcrypto$2e$node$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getRandomValues"])(new Uint32Array(8));
    return (arr[0] & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BITS21"]) * (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$binary$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BITS32"] + 1) + (arr[1] >>> 0);
};
const oneOf = (arr)=>arr[(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["floor"])(rand() * arr.length)];
// @ts-ignore
const uuidv4Template = [
    1e7
] + -1e3 + -4e3 + -8e3 + -1e11;
const uuidv4 = ()=>uuidv4Template.replace(/[018]/g, /** @param {number} c */ (c)=>(c ^ uint32() & 15 >> c / 4).toString(16));
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/metric.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Utility module to convert metric values.
 *
 * @module metric
 */ __turbopack_context__.s({
    "atto": (()=>atto),
    "centi": (()=>centi),
    "deca": (()=>deca),
    "deci": (()=>deci),
    "exa": (()=>exa),
    "femto": (()=>femto),
    "giga": (()=>giga),
    "hecto": (()=>hecto),
    "kilo": (()=>kilo),
    "mega": (()=>mega),
    "micro": (()=>micro),
    "milli": (()=>milli),
    "nano": (()=>nano),
    "peta": (()=>peta),
    "pico": (()=>pico),
    "prefix": (()=>prefix),
    "tera": (()=>tera),
    "yocto": (()=>yocto),
    "yotta": (()=>yotta),
    "zepto": (()=>zepto),
    "zetta": (()=>zetta)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/math.js [app-ssr] (ecmascript)");
;
const yotta = 1e24;
const zetta = 1e21;
const exa = 1e18;
const peta = 1e15;
const tera = 1e12;
const giga = 1e9;
const mega = 1e6;
const kilo = 1e3;
const hecto = 1e2;
const deca = 10;
const deci = 0.1;
const centi = 0.01;
const milli = 1e-3;
const micro = 1e-6;
const nano = 1e-9;
const pico = 1e-12;
const femto = 1e-15;
const atto = 1e-18;
const zepto = 1e-21;
const yocto = 1e-24;
const prefixUp = [
    '',
    'k',
    'M',
    'G',
    'T',
    'P',
    'E',
    'Z',
    'Y'
];
const prefixDown = [
    '',
    'm',
    'μ',
    'n',
    'p',
    'f',
    'a',
    'z',
    'y'
];
const prefix = (n, baseMultiplier = 0)=>{
    const nPow = n === 0 ? 0 : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["log10"])(n);
    let mult = 0;
    while(nPow < mult * 3 && baseMultiplier > -8){
        baseMultiplier--;
        mult--;
    }
    while(nPow >= 3 + mult * 3 && baseMultiplier < 8){
        baseMultiplier++;
        mult++;
    }
    const prefix = baseMultiplier < 0 ? prefixDown[-baseMultiplier] : prefixUp[baseMultiplier];
    return {
        n: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["round"])((mult > 0 ? n / (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["exp10"])(mult * 3) : n * (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["exp10"])(mult * -3)) * 1e12) / 1e12,
        prefix
    };
};
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/time.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Utility module to work with time.
 *
 * @module time
 */ __turbopack_context__.s({
    "getDate": (()=>getDate),
    "getUnixTime": (()=>getUnixTime),
    "humanizeDuration": (()=>humanizeDuration)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$metric$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/metric.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/math.js [app-ssr] (ecmascript)");
;
;
const getDate = ()=>new Date();
const getUnixTime = Date.now;
const humanizeDuration = (d)=>{
    if (d < 60000) {
        const p = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$metric$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prefix"])(d, -1);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["round"])(p.n * 100) / 100 + p.prefix + 's';
    }
    d = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["floor"])(d / 1000);
    const seconds = d % 60;
    const minutes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["floor"])(d / 60) % 60;
    const hours = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["floor"])(d / 3600) % 24;
    const days = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["floor"])(d / 86400);
    if (days > 0) {
        return days + 'd' + (hours > 0 || minutes > 30 ? ' ' + (minutes > 30 ? hours + 1 : hours) + 'h' : '');
    }
    if (hours > 0) {
        /* c8 ignore next */ return hours + 'h' + (minutes > 0 || seconds > 30 ? ' ' + (seconds > 30 ? minutes + 1 : minutes) + 'min' : '');
    }
    return minutes + 'min' + (seconds > 0 ? ' ' + seconds + 's' : '');
};
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/promise.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Utility helpers to work with promises.
 *
 * @module promise
 */ __turbopack_context__.s({
    "all": (()=>all),
    "create": (()=>create),
    "createEmpty": (()=>createEmpty),
    "isPromise": (()=>isPromise),
    "reject": (()=>reject),
    "resolve": (()=>resolve),
    "resolveWith": (()=>resolveWith),
    "until": (()=>until),
    "untilAsync": (()=>untilAsync),
    "wait": (()=>wait)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$time$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/time.js [app-ssr] (ecmascript)");
;
const create = (f)=>new Promise(f);
const createEmpty = (f)=>new Promise(f);
const all = Promise.all.bind(Promise);
const reject = (reason)=>Promise.reject(reason);
const resolve = (res)=>Promise.resolve(res);
const resolveWith = (res)=>Promise.resolve(res);
const until = (timeout, check, intervalResolution = 10)=>create((resolve, reject)=>{
        const startTime = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$time$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getUnixTime"])();
        const hasTimeout = timeout > 0;
        const untilInterval = ()=>{
            if (check()) {
                clearInterval(intervalHandle);
                resolve();
            } else if (hasTimeout) {
                /* c8 ignore else */ if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$time$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getUnixTime"])() - startTime > timeout) {
                    clearInterval(intervalHandle);
                    reject(new Error('Timeout'));
                }
            }
        };
        const intervalHandle = setInterval(untilInterval, intervalResolution);
    });
const untilAsync = async (check, timeout = 0, intervalResolution = 10)=>{
    const startTime = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$time$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getUnixTime"])();
    const noTimeout = timeout <= 0;
    // eslint-disable-next-line no-unmodified-loop-condition
    while(noTimeout || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$time$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getUnixTime"])() - startTime <= timeout){
        if (await check()) return;
        await wait(intervalResolution);
    }
    throw new Error('Timeout');
};
const wait = (timeout)=>create((resolve, _reject)=>setTimeout(resolve, timeout));
const isPromise = (p)=>p instanceof Promise || p && p.then && p.catch && p.finally;
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/conditions.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Often used conditions.
 *
 * @module conditions
 */ /**
 * @template T
 * @param {T|null|undefined} v
 * @return {T|null}
 */ /* c8 ignore next */ __turbopack_context__.s({
    "undefinedToNull": (()=>undefinedToNull)
});
const undefinedToNull = (v)=>v === undefined ? null : v;
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/storage.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/* eslint-env browser */ /**
 * Isomorphic variable storage.
 *
 * Uses LocalStorage in the browser and falls back to in-memory storage.
 *
 * @module storage
 */ /* c8 ignore start */ __turbopack_context__.s({
    "offChange": (()=>offChange),
    "onChange": (()=>onChange),
    "varStorage": (()=>varStorage)
});
class VarStoragePolyfill {
    constructor(){
        this.map = new Map();
    }
    /**
   * @param {string} key
   * @param {any} newValue
   */ setItem(key, newValue) {
        this.map.set(key, newValue);
    }
    /**
   * @param {string} key
   */ getItem(key) {
        return this.map.get(key);
    }
}
/* c8 ignore stop */ /**
 * @type {any}
 */ let _localStorage = new VarStoragePolyfill();
let usePolyfill = true;
/* c8 ignore start */ try {
    // if the same-origin rule is violated, accessing localStorage might thrown an error
    if (typeof localStorage !== 'undefined' && localStorage) {
        _localStorage = localStorage;
        usePolyfill = false;
    }
} catch (e) {}
const varStorage = _localStorage;
const onChange = (eventHandler)=>usePolyfill || addEventListener('storage', eventHandler);
const offChange = (eventHandler)=>usePolyfill || removeEventListener('storage', eventHandler);
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/object.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Utility functions for working with EcmaScript objects.
 *
 * @module object
 */ /**
 * @return {Object<string,any>} obj
 */ __turbopack_context__.s({
    "assign": (()=>assign),
    "create": (()=>create),
    "deepFreeze": (()=>deepFreeze),
    "equalFlat": (()=>equalFlat),
    "every": (()=>every),
    "forEach": (()=>forEach),
    "freeze": (()=>freeze),
    "hasProperty": (()=>hasProperty),
    "isEmpty": (()=>isEmpty),
    "keys": (()=>keys),
    "length": (()=>length),
    "map": (()=>map),
    "size": (()=>size),
    "some": (()=>some)
});
const create = ()=>Object.create(null);
const assign = Object.assign;
const keys = Object.keys;
const forEach = (obj, f)=>{
    for(const key in obj){
        f(obj[key], key);
    }
};
const map = (obj, f)=>{
    const results = [];
    for(const key in obj){
        results.push(f(obj[key], key));
    }
    return results;
};
const length = (obj)=>keys(obj).length;
const size = (obj)=>keys(obj).length;
const some = (obj, f)=>{
    for(const key in obj){
        if (f(obj[key], key)) {
            return true;
        }
    }
    return false;
};
const isEmpty = (obj)=>{
    // eslint-disable-next-line no-unreachable-loop
    for(const _k in obj){
        return false;
    }
    return true;
};
const every = (obj, f)=>{
    for(const key in obj){
        if (!f(obj[key], key)) {
            return false;
        }
    }
    return true;
};
const hasProperty = (obj, key)=>Object.prototype.hasOwnProperty.call(obj, key);
const equalFlat = (a, b)=>a === b || size(a) === size(b) && every(a, (val, key)=>(val !== undefined || hasProperty(b, key)) && b[key] === val);
const freeze = Object.freeze;
const deepFreeze = (o)=>{
    for(const key in o){
        const c = o[key];
        if (typeof c === 'object' || typeof c === 'function') {
            deepFreeze(o[key]);
        }
    }
    return freeze(o);
};
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/traits.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "EqualityTraitSymbol": (()=>EqualityTraitSymbol)
});
const EqualityTraitSymbol = Symbol('Equality') /**
 * @typedef {{ [EqualityTraitSymbol]:(other:EqualityTrait)=>boolean }} EqualityTrait
 */ ;
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/function.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Common functions and function call helpers.
 *
 * @module function
 */ __turbopack_context__.s({
    "apply": (()=>apply),
    "callAll": (()=>callAll),
    "equalityDeep": (()=>equalityDeep),
    "equalityFlat": (()=>equalityFlat),
    "equalityStrict": (()=>equalityStrict),
    "id": (()=>id),
    "is": (()=>is),
    "isArray": (()=>isArray),
    "isNumber": (()=>isNumber),
    "isOneOf": (()=>isOneOf),
    "isString": (()=>isString),
    "isTemplate": (()=>isTemplate),
    "nop": (()=>nop)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$array$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/array.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$object$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/object.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$traits$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/traits.js [app-ssr] (ecmascript)");
;
;
;
const callAll = (fs, args, i = 0)=>{
    try {
        for(; i < fs.length; i++){
            fs[i](...args);
        }
    } finally{
        if (i < fs.length) {
            callAll(fs, args, i + 1);
        }
    }
};
const nop = ()=>{};
const apply = (f)=>f();
const id = (a)=>a;
const equalityStrict = (a, b)=>a === b;
const equalityFlat = (a, b)=>a === b || a != null && b != null && a.constructor === b.constructor && ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$array$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isArray"])(a) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$array$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["equalFlat"])(a, b) || typeof a === 'object' && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$object$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["equalFlat"])(a, b));
const equalityDeep = (a, b)=>{
    if (a === b) {
        return true;
    }
    if (a == null || b == null || a.constructor !== b.constructor) {
        return false;
    }
    if (a[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$traits$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EqualityTraitSymbol"]] != null) {
        return a[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$traits$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EqualityTraitSymbol"]](b);
    }
    switch(a.constructor){
        case ArrayBuffer:
            a = new Uint8Array(a);
            b = new Uint8Array(b);
        // eslint-disable-next-line no-fallthrough
        case Uint8Array:
            {
                if (a.byteLength !== b.byteLength) {
                    return false;
                }
                for(let i = 0; i < a.length; i++){
                    if (a[i] !== b[i]) {
                        return false;
                    }
                }
                break;
            }
        case Set:
            {
                if (a.size !== b.size) {
                    return false;
                }
                for (const value of a){
                    if (!b.has(value)) {
                        return false;
                    }
                }
                break;
            }
        case Map:
            {
                if (a.size !== b.size) {
                    return false;
                }
                for (const key of a.keys()){
                    if (!b.has(key) || !equalityDeep(a.get(key), b.get(key))) {
                        return false;
                    }
                }
                break;
            }
        case Object:
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$object$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["length"])(a) !== (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$object$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["length"])(b)) {
                return false;
            }
            for(const key in a){
                if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$object$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["hasProperty"])(a, key) || !equalityDeep(a[key], b[key])) {
                    return false;
                }
            }
            break;
        case Array:
            if (a.length !== b.length) {
                return false;
            }
            for(let i = 0; i < a.length; i++){
                if (!equalityDeep(a[i], b[i])) {
                    return false;
                }
            }
            break;
        default:
            return false;
    }
    return true;
};
const isOneOf = (value, options)=>options.includes(value);
const isArray = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$array$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isArray"];
const isString = (s)=>s && s.constructor === String;
const isNumber = (n)=>n != null && n.constructor === Number;
const is = (n, T)=>n && n.constructor === T;
const isTemplate = (T)=>/**
   * @param {any} n
   * @return {n is InstanceType<TYPE>}
   **/ (n)=>n && n.constructor === T;
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/environment.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Isomorphic module to work access the environment (query params, env variables).
 *
 * @module environment
 */ __turbopack_context__.s({
    "ensureConf": (()=>ensureConf),
    "getConf": (()=>getConf),
    "getParam": (()=>getParam),
    "getVariable": (()=>getVariable),
    "hasConf": (()=>hasConf),
    "hasParam": (()=>hasParam),
    "isBrowser": (()=>isBrowser),
    "isMac": (()=>isMac),
    "isNode": (()=>isNode),
    "production": (()=>production),
    "supportsColor": (()=>supportsColor)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$map$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/map.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$string$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/string.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$conditions$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/conditions.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$storage$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/storage.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$function$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/function.js [app-ssr] (ecmascript)");
;
;
;
;
;
const isNode = typeof process !== 'undefined' && process.release && /node|io\.js/.test(process.release.name) && Object.prototype.toString.call(typeof process !== 'undefined' ? process : 0) === '[object process]';
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined' && !isNode;
const isMac = typeof navigator !== 'undefined' ? /Mac/.test(navigator.platform) : false;
/**
 * @type {Map<string,string>}
 */ let params;
const args = [];
/* c8 ignore start */ const computeParams = ()=>{
    if (params === undefined) {
        if (isNode) {
            params = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$map$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])();
            const pargs = process.argv;
            let currParamName = null;
            for(let i = 0; i < pargs.length; i++){
                const parg = pargs[i];
                if (parg[0] === '-') {
                    if (currParamName !== null) {
                        params.set(currParamName, '');
                    }
                    currParamName = parg;
                } else {
                    if (currParamName !== null) {
                        params.set(currParamName, parg);
                        currParamName = null;
                    } else {
                        args.push(parg);
                    }
                }
            }
            if (currParamName !== null) {
                params.set(currParamName, '');
            }
        // in ReactNative for example this would not be true (unless connected to the Remote Debugger)
        } else if (typeof location === 'object') {
            params = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$map$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])(); // eslint-disable-next-line no-undef
            (location.search || '?').slice(1).split('&').forEach((kv)=>{
                if (kv.length !== 0) {
                    const [key, value] = kv.split('=');
                    params.set(`--${(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$string$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fromCamelCase"])(key, '-')}`, value);
                    params.set(`-${(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$string$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fromCamelCase"])(key, '-')}`, value);
                }
            });
        } else {
            params = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$map$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])();
        }
    }
    return params;
};
const hasParam = (name)=>computeParams().has(name);
const getParam = (name, defaultVal)=>computeParams().get(name) || defaultVal;
const getVariable = (name)=>isNode ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$conditions$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["undefinedToNull"])(process.env[name.toUpperCase().replaceAll('-', '_')]) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$conditions$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["undefinedToNull"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$storage$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["varStorage"].getItem(name));
const getConf = (name)=>computeParams().get('--' + name) || getVariable(name);
const ensureConf = (name)=>{
    const c = getConf(name);
    if (c == null) throw new Error(`Expected configuration "${name.toUpperCase().replaceAll('-', '_')}"`);
    return c;
};
const hasConf = (name)=>hasParam('--' + name) || getVariable(name) !== null;
const production = hasConf('production');
/* c8 ignore next 2 */ const forceColor = isNode && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$function$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isOneOf"])(process.env.FORCE_COLOR, [
    'true',
    '1',
    '2'
]);
const supportsColor = forceColor || !hasParam('--no-colors') && // @todo deprecate --no-colors
!hasConf('no-color') && (!isNode || process.stdout.isTTY) && (!isNode || hasParam('--color') || getVariable('COLORTERM') !== null || (getVariable('TERM') || '').includes('color')) /* c8 ignore stop */ ;
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/buffer.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Utility functions to work with buffers (Uint8Array).
 *
 * @module buffer
 */ __turbopack_context__.s({
    "copyUint8Array": (()=>copyUint8Array),
    "createUint8ArrayFromArrayBuffer": (()=>createUint8ArrayFromArrayBuffer),
    "createUint8ArrayFromLen": (()=>createUint8ArrayFromLen),
    "createUint8ArrayViewFromArrayBuffer": (()=>createUint8ArrayViewFromArrayBuffer),
    "decodeAny": (()=>decodeAny),
    "encodeAny": (()=>encodeAny),
    "fromBase64": (()=>fromBase64),
    "fromBase64UrlEncoded": (()=>fromBase64UrlEncoded),
    "fromHexString": (()=>fromHexString),
    "shiftNBitsLeft": (()=>shiftNBitsLeft),
    "toBase64": (()=>toBase64),
    "toBase64UrlEncoded": (()=>toBase64UrlEncoded),
    "toHexString": (()=>toHexString)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$string$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/string.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$environment$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/environment.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$array$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/array.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/math.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$encoding$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/encoding.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$decoding$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/decoding.js [app-ssr] (ecmascript)");
;
;
;
;
;
;
const createUint8ArrayFromLen = (len)=>new Uint8Array(len);
const createUint8ArrayViewFromArrayBuffer = (buffer, byteOffset, length)=>new Uint8Array(buffer, byteOffset, length);
const createUint8ArrayFromArrayBuffer = (buffer)=>new Uint8Array(buffer);
/* c8 ignore start */ /**
 * @param {Uint8Array} bytes
 * @return {string}
 */ const toBase64Browser = (bytes)=>{
    let s = '';
    for(let i = 0; i < bytes.byteLength; i++){
        s += (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$string$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fromCharCode"])(bytes[i]);
    }
    // eslint-disable-next-line no-undef
    return btoa(s);
};
/* c8 ignore stop */ /**
 * @param {Uint8Array} bytes
 * @return {string}
 */ const toBase64Node = (bytes)=>Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64');
/* c8 ignore start */ /**
 * @param {string} s
 * @return {Uint8Array}
 */ const fromBase64Browser = (s)=>{
    // eslint-disable-next-line no-undef
    const a = atob(s);
    const bytes = createUint8ArrayFromLen(a.length);
    for(let i = 0; i < a.length; i++){
        bytes[i] = a.charCodeAt(i);
    }
    return bytes;
};
/* c8 ignore stop */ /**
 * @param {string} s
 */ const fromBase64Node = (s)=>{
    const buf = Buffer.from(s, 'base64');
    return createUint8ArrayViewFromArrayBuffer(buf.buffer, buf.byteOffset, buf.byteLength);
};
const toBase64 = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$environment$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isBrowser"] ? toBase64Browser : toBase64Node;
const fromBase64 = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$environment$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isBrowser"] ? fromBase64Browser : fromBase64Node;
const toBase64UrlEncoded = (buf)=>toBase64(buf).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
const fromBase64UrlEncoded = (base64)=>fromBase64(base64.replaceAll('-', '+').replaceAll('_', '/'));
const toHexString = (buf)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$array$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["map"])(buf, (b)=>b.toString(16).padStart(2, '0')).join('');
const fromHexString = (hex)=>{
    const hlen = hex.length;
    const buf = new Uint8Array((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$math$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ceil"])(hlen / 2));
    for(let i = 0; i < hlen; i += 2){
        buf[buf.length - i / 2 - 1] = Number.parseInt(hex.slice(hlen - i - 2, hlen - i), 16);
    }
    return buf;
};
const copyUint8Array = (uint8Array)=>{
    const newBuf = createUint8ArrayFromLen(uint8Array.byteLength);
    newBuf.set(uint8Array);
    return newBuf;
};
const encodeAny = (data)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$encoding$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["encode"])((encoder)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$encoding$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["writeAny"])(encoder, data));
const decodeAny = (buf)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$decoding$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["readAny"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$decoding$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createDecoder"])(buf));
const shiftNBitsLeft = (bs, N)=>{
    if (N === 0) return bs;
    bs = new Uint8Array(bs);
    bs[0] <<= N;
    for(let i = 1; i < bs.length; i++){
        bs[i - 1] |= bs[i] >>> 8 - N;
        bs[i] <<= N;
    }
    return bs;
};
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/symbol.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Utility module to work with EcmaScript Symbols.
 *
 * @module symbol
 */ /**
 * Return fresh symbol.
 */ __turbopack_context__.s({
    "create": (()=>create),
    "isSymbol": (()=>isSymbol)
});
const create = Symbol;
const isSymbol = (s)=>typeof s === 'symbol';
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/json.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * JSON utility functions.
 *
 * @module json
 */ /**
 * Transform JavaScript object to JSON.
 *
 * @param {any} object
 * @return {string}
 */ __turbopack_context__.s({
    "parse": (()=>parse),
    "stringify": (()=>stringify)
});
const stringify = JSON.stringify;
const parse = JSON.parse;
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/logging.common.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "BLUE": (()=>BLUE),
    "BOLD": (()=>BOLD),
    "GREEN": (()=>GREEN),
    "GREY": (()=>GREY),
    "ORANGE": (()=>ORANGE),
    "PURPLE": (()=>PURPLE),
    "RED": (()=>RED),
    "UNBOLD": (()=>UNBOLD),
    "UNCOLOR": (()=>UNCOLOR),
    "computeNoColorLoggingArgs": (()=>computeNoColorLoggingArgs),
    "createModuleLogger": (()=>createModuleLogger)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$symbol$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/symbol.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$time$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/time.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$environment$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/environment.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$function$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/function.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$json$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/json.js [app-ssr] (ecmascript)");
;
;
;
;
;
const BOLD = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$symbol$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])();
const UNBOLD = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$symbol$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])();
const BLUE = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$symbol$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])();
const GREY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$symbol$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])();
const GREEN = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$symbol$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])();
const RED = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$symbol$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])();
const PURPLE = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$symbol$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])();
const ORANGE = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$symbol$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])();
const UNCOLOR = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$symbol$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])();
const computeNoColorLoggingArgs = (args)=>{
    if (args.length === 1 && args[0]?.constructor === Function) {
        args = /** @type {[function]} */ args[0]();
    }
    const strBuilder = [];
    const logArgs = [];
    // try with formatting until we find something unsupported
    let i = 0;
    for(; i < args.length; i++){
        const arg = args[i];
        if (arg === undefined) {
            break;
        } else if (arg.constructor === String || arg.constructor === Number) {
            strBuilder.push(arg);
        } else if (arg.constructor === Object) {
            break;
        }
    }
    if (i > 0) {
        // create logArgs with what we have so far
        logArgs.push(strBuilder.join(''));
    }
    // append the rest
    for(; i < args.length; i++){
        const arg = args[i];
        if (!(arg instanceof Symbol)) {
            logArgs.push(arg);
        }
    }
    return logArgs;
};
/* c8 ignore stop */ const loggingColors = [
    GREEN,
    PURPLE,
    ORANGE,
    BLUE
];
let nextColor = 0;
let lastLoggingTime = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$time$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getUnixTime"])();
const createModuleLogger = (_print, moduleName)=>{
    const color = loggingColors[nextColor];
    const debugRegexVar = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$environment$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getVariable"])('log');
    const doLogging = debugRegexVar !== null && (debugRegexVar === '*' || debugRegexVar === 'true' || new RegExp(debugRegexVar, 'gi').test(moduleName));
    nextColor = (nextColor + 1) % loggingColors.length;
    moduleName += ': ';
    return !doLogging ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$function$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["nop"] : (...args)=>{
        if (args.length === 1 && args[0]?.constructor === Function) {
            args = args[0]();
        }
        const timeNow = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$time$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getUnixTime"])();
        const timeDiff = timeNow - lastLoggingTime;
        lastLoggingTime = timeNow;
        _print(color, moduleName, UNCOLOR, ...args.map((arg)=>{
            if (arg != null && arg.constructor === Uint8Array) {
                arg = Array.from(arg);
            }
            const t = typeof arg;
            switch(t){
                case 'string':
                case 'symbol':
                    return arg;
                default:
                    {
                        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$json$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["stringify"])(arg);
                    }
            }
        }), color, ' +' + timeDiff + 'ms');
    };
} /* c8 ignore stop */ ;
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/logging.node.js [app-ssr] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Isomorphic logging module with support for colors!
 *
 * @module logging
 */ __turbopack_context__.s({
    "createModuleLogger": (()=>createModuleLogger),
    "createVConsole": (()=>createVConsole),
    "group": (()=>group),
    "groupCollapsed": (()=>groupCollapsed),
    "groupEnd": (()=>groupEnd),
    "print": (()=>print),
    "printCanvas": (()=>printCanvas),
    "printDom": (()=>printDom),
    "printError": (()=>printError),
    "printImg": (()=>printImg),
    "printImgBase64": (()=>printImgBase64),
    "warn": (()=>warn)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$environment$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/environment.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$logging$2e$common$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/logging.common.js [app-ssr] (ecmascript)");
;
;
;
const _nodeStyleMap = {
    [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$logging$2e$common$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BOLD"]]: '\u001b[1m',
    [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$logging$2e$common$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UNBOLD"]]: '\u001b[2m',
    [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$logging$2e$common$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BLUE"]]: '\x1b[34m',
    [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$logging$2e$common$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GREEN"]]: '\x1b[32m',
    [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$logging$2e$common$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GREY"]]: '\u001b[37m',
    [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$logging$2e$common$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RED"]]: '\x1b[31m',
    [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$logging$2e$common$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PURPLE"]]: '\x1b[35m',
    [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$logging$2e$common$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ORANGE"]]: '\x1b[38;5;208m',
    [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$logging$2e$common$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UNCOLOR"]]: '\x1b[0m'
};
/* c8 ignore start */ /**
 * @param {Array<string|undefined|Symbol|Object|number|function():Array<any>>} args
 * @return {Array<string|object|number|undefined>}
 */ const computeNodeLoggingArgs = (args)=>{
    if (args.length === 1 && args[0]?.constructor === Function) {
        args = /** @type {[function]} */ args[0]();
    }
    const strBuilder = [];
    const logArgs = [];
    // try with formatting until we find something unsupported
    let i = 0;
    for(; i < args.length; i++){
        const arg = args[i];
        // @ts-ignore
        const style = _nodeStyleMap[arg];
        if (style !== undefined) {
            strBuilder.push(style);
        } else {
            if (arg === undefined) {
                break;
            } else if (arg.constructor === String || arg.constructor === Number) {
                strBuilder.push(arg);
            } else {
                break;
            }
        }
    }
    if (i > 0) {
        // create logArgs with what we have so far
        strBuilder.push('\x1b[0m');
        logArgs.push(strBuilder.join(''));
    }
    // append the rest
    for(; i < args.length; i++){
        const arg = args[i];
        if (!(arg instanceof Symbol)) {
            logArgs.push(arg);
        }
    }
    return logArgs;
};
/* c8 ignore stop */ /* c8 ignore start */ const computeLoggingArgs = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$environment$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supportsColor"] ? computeNodeLoggingArgs : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$logging$2e$common$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["computeNoColorLoggingArgs"];
const print = (...args)=>{
    console.log(...computeLoggingArgs(args));
};
const warn = (...args)=>{
    console.warn(...computeLoggingArgs(args));
};
const printError = (err)=>{
    console.error(err);
};
const printImg = (_url, _height)=>{
// console.log('%c                ', `font-size: ${height}x; background: url(${url}) no-repeat;`)
};
const printImgBase64 = (base64, height)=>printImg(`data:image/gif;base64,${base64}`, height);
const group = (...args)=>{
    console.group(...computeLoggingArgs(args));
};
const groupCollapsed = (...args)=>{
    console.groupCollapsed(...computeLoggingArgs(args));
};
const groupEnd = ()=>{
    console.groupEnd();
};
const printDom = (_createNode)=>{};
const printCanvas = (canvas, height)=>printImg(canvas.toDataURL(), height);
const createVConsole = (_dom)=>{};
const createModuleLogger = (moduleName)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$logging$2e$common$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createModuleLogger"])(print, moduleName);
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/iterator.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Utility module to create and manipulate Iterators.
 *
 * @module iterator
 */ /**
 * @template T,R
 * @param {Iterator<T>} iterator
 * @param {function(T):R} f
 * @return {IterableIterator<R>}
 */ __turbopack_context__.s({
    "createIterator": (()=>createIterator),
    "iteratorFilter": (()=>iteratorFilter),
    "iteratorMap": (()=>iteratorMap),
    "mapIterator": (()=>mapIterator)
});
const mapIterator = (iterator, f)=>({
        [Symbol.iterator] () {
            return this;
        },
        // @ts-ignore
        next () {
            const r = iterator.next();
            return {
                value: r.done ? undefined : f(r.value),
                done: r.done
            };
        }
    });
const createIterator = (next)=>({
        /**
   * @return {IterableIterator<T>}
   */ [Symbol.iterator] () {
            return this;
        },
        // @ts-ignore
        next
    });
const iteratorFilter = (iterator, filter)=>createIterator(()=>{
        let res;
        do {
            res = iterator.next();
        }while (!res.done && !filter(res.value))
        return res;
    });
const iteratorMap = (iterator, fmap)=>createIterator(()=>{
        const { done, value } = iterator.next();
        return {
            done,
            value: done ? undefined : fmap(value)
        };
    });
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/broadcastchannel.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/* eslint-env browser */ /**
 * Helpers for cross-tab communication using broadcastchannel with LocalStorage fallback.
 *
 * ```js
 * // In browser window A:
 * broadcastchannel.subscribe('my events', data => console.log(data))
 * broadcastchannel.publish('my events', 'Hello world!') // => A: 'Hello world!' fires synchronously in same tab
 *
 * // In browser window B:
 * broadcastchannel.publish('my events', 'hello from tab B') // => A: 'hello from tab B'
 * ```
 *
 * @module broadcastchannel
 */ // @todo before next major: use Uint8Array instead as buffer object
__turbopack_context__.s({
    "publish": (()=>publish),
    "subscribe": (()=>subscribe),
    "unsubscribe": (()=>unsubscribe)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$map$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/map.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$set$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/set.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$buffer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/buffer.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$storage$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/storage.js [app-ssr] (ecmascript)");
;
;
;
;
/**
 * @typedef {Object} Channel
 * @property {Set<function(any, any):any>} Channel.subs
 * @property {any} Channel.bc
 */ /**
 * @type {Map<string, Channel>}
 */ const channels = new Map();
/* c8 ignore start */ class LocalStoragePolyfill {
    /**
   * @param {string} room
   */ constructor(room){
        this.room = room;
        /**
     * @type {null|function({data:ArrayBuffer}):void}
     */ this.onmessage = null;
        /**
     * @param {any} e
     */ this._onChange = (e)=>e.key === room && this.onmessage !== null && this.onmessage({
                data: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$buffer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fromBase64"])(e.newValue || '')
            });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$storage$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["onChange"])(this._onChange);
    }
    /**
   * @param {ArrayBuffer} buf
   */ postMessage(buf) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$storage$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["varStorage"].setItem(this.room, (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$buffer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toBase64"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$buffer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createUint8ArrayFromArrayBuffer"])(buf)));
    }
    close() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$storage$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["offChange"])(this._onChange);
    }
}
/* c8 ignore stop */ // Use BroadcastChannel or Polyfill
/* c8 ignore next */ const BC = typeof BroadcastChannel === 'undefined' ? LocalStoragePolyfill : BroadcastChannel;
/**
 * @param {string} room
 * @return {Channel}
 */ const getChannel = (room)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$map$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setIfUndefined"])(channels, room, ()=>{
        const subs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$set$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])();
        const bc = new BC(room);
        /**
     * @param {{data:ArrayBuffer}} e
     */ /* c8 ignore next */ bc.onmessage = (e)=>subs.forEach((sub)=>sub(e.data, 'broadcastchannel'));
        return {
            bc,
            subs
        };
    });
const subscribe = (room, f)=>{
    getChannel(room).subs.add(f);
    return f;
};
const unsubscribe = (room, f)=>{
    const channel = getChannel(room);
    const unsubscribed = channel.subs.delete(f);
    if (unsubscribed && channel.subs.size === 0) {
        channel.bc.close();
        channels.delete(room);
    }
    return unsubscribed;
};
const publish = (room, data, origin = null)=>{
    const c = getChannel(room);
    c.bc.postMessage(data);
    c.subs.forEach((sub)=>sub(data, origin));
};
}}),
"[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/url.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Utility module to work with urls.
 *
 * @module url
 */ __turbopack_context__.s({
    "decodeQueryParams": (()=>decodeQueryParams),
    "encodeQueryParams": (()=>encodeQueryParams)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$object$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lib0@0.2.108/node_modules/lib0/object.js [app-ssr] (ecmascript)");
;
const decodeQueryParams = (url)=>{
    /**
   * @type {Object<string,string>}
   */ const query = {};
    const urlQuerySplit = url.split('?');
    const pairs = urlQuerySplit[urlQuerySplit.length - 1].split('&');
    for(let i = 0; i < pairs.length; i++){
        const item = pairs[i];
        if (item.length > 0) {
            const pair = item.split('=');
            query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
        }
    }
    return query;
};
const encodeQueryParams = (params)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lib0$40$0$2e$2$2e$108$2f$node_modules$2f$lib0$2f$object$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["map"])(params, (val, key)=>`${encodeURIComponent(key)}=${encodeURIComponent(val)}`).join('&');
}}),

};

//# sourceMappingURL=bca4c_lib0_6e56e0f1._.js.map