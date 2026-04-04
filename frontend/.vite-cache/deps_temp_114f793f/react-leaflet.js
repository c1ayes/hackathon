import { n as __toESM, t as __commonJSMin } from "./chunk-BVTlhY3a.js";
import { t as require_react } from "./react.js";
import { t as require_leaflet_src } from "./leaflet.js";
//#region node_modules/@react-leaflet/core/lib/attribution.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
function useAttribution(map, attribution) {
	const attributionRef = (0, import_react.useRef)(attribution);
	(0, import_react.useEffect)(function updateAttribution() {
		if (attribution !== attributionRef.current && map.attributionControl != null) {
			if (attributionRef.current != null) map.attributionControl.removeAttribution(attributionRef.current);
			if (attribution != null) map.attributionControl.addAttribution(attribution);
		}
		attributionRef.current = attribution;
	}, [map, attribution]);
}
//#endregion
//#region node_modules/@react-leaflet/core/lib/circle.js
function updateCircle(layer, props, prevProps) {
	if (props.center !== prevProps.center) layer.setLatLng(props.center);
	if (props.radius != null && props.radius !== prevProps.radius) layer.setRadius(props.radius);
}
//#endregion
//#region node_modules/react-dom/cjs/react-dom.development.js
/**
* @license React
* react-dom.development.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_dom_development = /* @__PURE__ */ __commonJSMin(((exports) => {
	(function() {
		function noop() {}
		function testStringCoercion(value) {
			return "" + value;
		}
		function createPortal$1(children, containerInfo, implementation) {
			var key = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
			try {
				testStringCoercion(key);
				var JSCompiler_inline_result = !1;
			} catch (e) {
				JSCompiler_inline_result = !0;
			}
			JSCompiler_inline_result && (console.error("The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", "function" === typeof Symbol && Symbol.toStringTag && key[Symbol.toStringTag] || key.constructor.name || "Object"), testStringCoercion(key));
			return {
				$$typeof: REACT_PORTAL_TYPE,
				key: null == key ? null : "" + key,
				children,
				containerInfo,
				implementation
			};
		}
		function getCrossOriginStringAs(as, input) {
			if ("font" === as) return "";
			if ("string" === typeof input) return "use-credentials" === input ? input : "";
		}
		function getValueDescriptorExpectingObjectForWarning(thing) {
			return null === thing ? "`null`" : void 0 === thing ? "`undefined`" : "" === thing ? "an empty string" : "something with type \"" + typeof thing + "\"";
		}
		function getValueDescriptorExpectingEnumForWarning(thing) {
			return null === thing ? "`null`" : void 0 === thing ? "`undefined`" : "" === thing ? "an empty string" : "string" === typeof thing ? JSON.stringify(thing) : "number" === typeof thing ? "`" + thing + "`" : "something with type \"" + typeof thing + "\"";
		}
		function resolveDispatcher() {
			var dispatcher = ReactSharedInternals.H;
			null === dispatcher && console.error("Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.");
			return dispatcher;
		}
		"undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
		var React = require_react(), Internals = {
			d: {
				f: noop,
				r: function() {
					throw Error("Invalid form element. requestFormReset must be passed a form that was rendered by React.");
				},
				D: noop,
				C: noop,
				L: noop,
				m: noop,
				X: noop,
				S: noop,
				M: noop
			},
			p: 0,
			findDOMNode: null
		}, REACT_PORTAL_TYPE = Symbol.for("react.portal"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
		"function" === typeof Map && null != Map.prototype && "function" === typeof Map.prototype.forEach && "function" === typeof Set && null != Set.prototype && "function" === typeof Set.prototype.clear && "function" === typeof Set.prototype.forEach || console.error("React depends on Map and Set built-in types. Make sure that you load a polyfill in older browsers. https://reactjs.org/link/react-polyfills");
		exports.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = Internals;
		exports.createPortal = function(children, container) {
			var key = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
			if (!container || 1 !== container.nodeType && 9 !== container.nodeType && 11 !== container.nodeType) throw Error("Target container is not a DOM element.");
			return createPortal$1(children, container, null, key);
		};
		exports.flushSync = function(fn) {
			var previousTransition = ReactSharedInternals.T, previousUpdatePriority = Internals.p;
			try {
				if (ReactSharedInternals.T = null, Internals.p = 2, fn) return fn();
			} finally {
				ReactSharedInternals.T = previousTransition, Internals.p = previousUpdatePriority, Internals.d.f() && console.error("flushSync was called from inside a lifecycle method. React cannot flush when React is already rendering. Consider moving this call to a scheduler task or micro task.");
			}
		};
		exports.preconnect = function(href, options) {
			"string" === typeof href && href ? null != options && "object" !== typeof options ? console.error("ReactDOM.preconnect(): Expected the `options` argument (second) to be an object but encountered %s instead. The only supported option at this time is `crossOrigin` which accepts a string.", getValueDescriptorExpectingEnumForWarning(options)) : null != options && "string" !== typeof options.crossOrigin && console.error("ReactDOM.preconnect(): Expected the `crossOrigin` option (second argument) to be a string but encountered %s instead. Try removing this option or passing a string value instead.", getValueDescriptorExpectingObjectForWarning(options.crossOrigin)) : console.error("ReactDOM.preconnect(): Expected the `href` argument (first) to be a non-empty string but encountered %s instead.", getValueDescriptorExpectingObjectForWarning(href));
			"string" === typeof href && (options ? (options = options.crossOrigin, options = "string" === typeof options ? "use-credentials" === options ? options : "" : void 0) : options = null, Internals.d.C(href, options));
		};
		exports.prefetchDNS = function(href) {
			if ("string" !== typeof href || !href) console.error("ReactDOM.prefetchDNS(): Expected the `href` argument (first) to be a non-empty string but encountered %s instead.", getValueDescriptorExpectingObjectForWarning(href));
			else if (1 < arguments.length) {
				var options = arguments[1];
				"object" === typeof options && options.hasOwnProperty("crossOrigin") ? console.error("ReactDOM.prefetchDNS(): Expected only one argument, `href`, but encountered %s as a second argument instead. This argument is reserved for future options and is currently disallowed. It looks like the you are attempting to set a crossOrigin property for this DNS lookup hint. Browsers do not perform DNS queries using CORS and setting this attribute on the resource hint has no effect. Try calling ReactDOM.prefetchDNS() with just a single string argument, `href`.", getValueDescriptorExpectingEnumForWarning(options)) : console.error("ReactDOM.prefetchDNS(): Expected only one argument, `href`, but encountered %s as a second argument instead. This argument is reserved for future options and is currently disallowed. Try calling ReactDOM.prefetchDNS() with just a single string argument, `href`.", getValueDescriptorExpectingEnumForWarning(options));
			}
			"string" === typeof href && Internals.d.D(href);
		};
		exports.preinit = function(href, options) {
			"string" === typeof href && href ? null == options || "object" !== typeof options ? console.error("ReactDOM.preinit(): Expected the `options` argument (second) to be an object with an `as` property describing the type of resource to be preinitialized but encountered %s instead.", getValueDescriptorExpectingEnumForWarning(options)) : "style" !== options.as && "script" !== options.as && console.error("ReactDOM.preinit(): Expected the `as` property in the `options` argument (second) to contain a valid value describing the type of resource to be preinitialized but encountered %s instead. Valid values for `as` are \"style\" and \"script\".", getValueDescriptorExpectingEnumForWarning(options.as)) : console.error("ReactDOM.preinit(): Expected the `href` argument (first) to be a non-empty string but encountered %s instead.", getValueDescriptorExpectingObjectForWarning(href));
			if ("string" === typeof href && options && "string" === typeof options.as) {
				var as = options.as, crossOrigin = getCrossOriginStringAs(as, options.crossOrigin), integrity = "string" === typeof options.integrity ? options.integrity : void 0, fetchPriority = "string" === typeof options.fetchPriority ? options.fetchPriority : void 0;
				"style" === as ? Internals.d.S(href, "string" === typeof options.precedence ? options.precedence : void 0, {
					crossOrigin,
					integrity,
					fetchPriority
				}) : "script" === as && Internals.d.X(href, {
					crossOrigin,
					integrity,
					fetchPriority,
					nonce: "string" === typeof options.nonce ? options.nonce : void 0
				});
			}
		};
		exports.preinitModule = function(href, options) {
			var encountered = "";
			"string" === typeof href && href || (encountered += " The `href` argument encountered was " + getValueDescriptorExpectingObjectForWarning(href) + ".");
			void 0 !== options && "object" !== typeof options ? encountered += " The `options` argument encountered was " + getValueDescriptorExpectingObjectForWarning(options) + "." : options && "as" in options && "script" !== options.as && (encountered += " The `as` option encountered was " + getValueDescriptorExpectingEnumForWarning(options.as) + ".");
			if (encountered) console.error("ReactDOM.preinitModule(): Expected up to two arguments, a non-empty `href` string and, optionally, an `options` object with a valid `as` property.%s", encountered);
			else switch (encountered = options && "string" === typeof options.as ? options.as : "script", encountered) {
				case "script": break;
				default: encountered = getValueDescriptorExpectingEnumForWarning(encountered), console.error("ReactDOM.preinitModule(): Currently the only supported \"as\" type for this function is \"script\" but received \"%s\" instead. This warning was generated for `href` \"%s\". In the future other module types will be supported, aligning with the import-attributes proposal. Learn more here: (https://github.com/tc39/proposal-import-attributes)", encountered, href);
			}
			if ("string" === typeof href) if ("object" === typeof options && null !== options) {
				if (null == options.as || "script" === options.as) encountered = getCrossOriginStringAs(options.as, options.crossOrigin), Internals.d.M(href, {
					crossOrigin: encountered,
					integrity: "string" === typeof options.integrity ? options.integrity : void 0,
					nonce: "string" === typeof options.nonce ? options.nonce : void 0
				});
			} else options ?? Internals.d.M(href);
		};
		exports.preload = function(href, options) {
			var encountered = "";
			"string" === typeof href && href || (encountered += " The `href` argument encountered was " + getValueDescriptorExpectingObjectForWarning(href) + ".");
			null == options || "object" !== typeof options ? encountered += " The `options` argument encountered was " + getValueDescriptorExpectingObjectForWarning(options) + "." : "string" === typeof options.as && options.as || (encountered += " The `as` option encountered was " + getValueDescriptorExpectingObjectForWarning(options.as) + ".");
			encountered && console.error("ReactDOM.preload(): Expected two arguments, a non-empty `href` string and an `options` object with an `as` property valid for a `<link rel=\"preload\" as=\"...\" />` tag.%s", encountered);
			if ("string" === typeof href && "object" === typeof options && null !== options && "string" === typeof options.as) {
				encountered = options.as;
				var crossOrigin = getCrossOriginStringAs(encountered, options.crossOrigin);
				Internals.d.L(href, encountered, {
					crossOrigin,
					integrity: "string" === typeof options.integrity ? options.integrity : void 0,
					nonce: "string" === typeof options.nonce ? options.nonce : void 0,
					type: "string" === typeof options.type ? options.type : void 0,
					fetchPriority: "string" === typeof options.fetchPriority ? options.fetchPriority : void 0,
					referrerPolicy: "string" === typeof options.referrerPolicy ? options.referrerPolicy : void 0,
					imageSrcSet: "string" === typeof options.imageSrcSet ? options.imageSrcSet : void 0,
					imageSizes: "string" === typeof options.imageSizes ? options.imageSizes : void 0,
					media: "string" === typeof options.media ? options.media : void 0
				});
			}
		};
		exports.preloadModule = function(href, options) {
			var encountered = "";
			"string" === typeof href && href || (encountered += " The `href` argument encountered was " + getValueDescriptorExpectingObjectForWarning(href) + ".");
			void 0 !== options && "object" !== typeof options ? encountered += " The `options` argument encountered was " + getValueDescriptorExpectingObjectForWarning(options) + "." : options && "as" in options && "string" !== typeof options.as && (encountered += " The `as` option encountered was " + getValueDescriptorExpectingObjectForWarning(options.as) + ".");
			encountered && console.error("ReactDOM.preloadModule(): Expected two arguments, a non-empty `href` string and, optionally, an `options` object with an `as` property valid for a `<link rel=\"modulepreload\" as=\"...\" />` tag.%s", encountered);
			"string" === typeof href && (options ? (encountered = getCrossOriginStringAs(options.as, options.crossOrigin), Internals.d.m(href, {
				as: "string" === typeof options.as && "script" !== options.as ? options.as : void 0,
				crossOrigin: encountered,
				integrity: "string" === typeof options.integrity ? options.integrity : void 0
			})) : Internals.d.m(href));
		};
		exports.requestFormReset = function(form) {
			Internals.d.r(form);
		};
		exports.unstable_batchedUpdates = function(fn, a) {
			return fn(a);
		};
		exports.useFormState = function(action, initialState, permalink) {
			return resolveDispatcher().useFormState(action, initialState, permalink);
		};
		exports.useFormStatus = function() {
			return resolveDispatcher().useHostTransitionStatus();
		};
		exports.version = "19.2.4";
		"undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
	})();
}));
//#endregion
//#region node_modules/react-dom/index.js
var require_react_dom = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_react_dom_development();
}));
function createLeafletContext(map) {
	return Object.freeze({
		__version: 1,
		map
	});
}
function extendContext(source, extra) {
	return Object.freeze({
		...source,
		...extra
	});
}
var LeafletContext = (0, import_react.createContext)(null);
function useLeafletContext() {
	const context = (0, import_react.use)(LeafletContext);
	if (context == null) throw new Error("No context provided: useLeafletContext() can only be used in a descendant of <MapContainer>");
	return context;
}
//#endregion
//#region node_modules/@react-leaflet/core/lib/component.js
var import_react_dom = require_react_dom();
function createContainerComponent(useElement) {
	function ContainerComponent(props, forwardedRef) {
		const { instance, context } = useElement(props).current;
		(0, import_react.useImperativeHandle)(forwardedRef, () => instance);
		const { children } = props;
		return children == null ? null : /* @__PURE__ */ import_react.createElement(LeafletContext, { value: context }, children);
	}
	return /* @__PURE__ */ (0, import_react.forwardRef)(ContainerComponent);
}
function createDivOverlayComponent(useElement) {
	function OverlayComponent(props, forwardedRef) {
		const [isOpen, setOpen] = (0, import_react.useState)(false);
		const { instance } = useElement(props, setOpen).current;
		(0, import_react.useImperativeHandle)(forwardedRef, () => instance);
		(0, import_react.useEffect)(function updateOverlay() {
			if (isOpen) instance.update();
		}, [
			instance,
			isOpen,
			props.children
		]);
		const contentNode = instance._contentNode;
		return contentNode ? /* @__PURE__ */ (0, import_react_dom.createPortal)(props.children, contentNode) : null;
	}
	return /* @__PURE__ */ (0, import_react.forwardRef)(OverlayComponent);
}
function createLeafComponent(useElement) {
	function LeafComponent(props, forwardedRef) {
		const { instance } = useElement(props).current;
		(0, import_react.useImperativeHandle)(forwardedRef, () => instance);
		return null;
	}
	return /* @__PURE__ */ (0, import_react.forwardRef)(LeafComponent);
}
//#endregion
//#region node_modules/@react-leaflet/core/lib/control.js
function createControlHook(useElement) {
	return function useLeafletControl(props) {
		const context = useLeafletContext();
		const elementRef = useElement(props, context);
		const { instance } = elementRef.current;
		const positionRef = (0, import_react.useRef)(props.position);
		const { position } = props;
		(0, import_react.useEffect)(function addControl() {
			instance.addTo(context.map);
			return function removeControl() {
				instance.remove();
			};
		}, [context.map, instance]);
		(0, import_react.useEffect)(function updateControl() {
			if (position != null && position !== positionRef.current) {
				instance.setPosition(position);
				positionRef.current = position;
			}
		}, [instance, position]);
		return elementRef;
	};
}
//#endregion
//#region node_modules/@react-leaflet/core/lib/events.js
function useEventHandlers(element, eventHandlers) {
	const eventHandlersRef = (0, import_react.useRef)(void 0);
	(0, import_react.useEffect)(function addEventHandlers() {
		if (eventHandlers != null) element.instance.on(eventHandlers);
		eventHandlersRef.current = eventHandlers;
		return function removeEventHandlers() {
			if (eventHandlersRef.current != null) element.instance.off(eventHandlersRef.current);
			eventHandlersRef.current = null;
		};
	}, [element, eventHandlers]);
}
//#endregion
//#region node_modules/@react-leaflet/core/lib/pane.js
function withPane(props, context) {
	const pane = props.pane ?? context.pane;
	return pane ? {
		...props,
		pane
	} : props;
}
//#endregion
//#region node_modules/@react-leaflet/core/lib/div-overlay.js
function createDivOverlayHook(useElement, useLifecycle) {
	return function useDivOverlay(props, setOpen) {
		const context = useLeafletContext();
		const elementRef = useElement(withPane(props, context), context);
		useAttribution(context.map, props.attribution);
		useEventHandlers(elementRef.current, props.eventHandlers);
		useLifecycle(elementRef.current, context, props, setOpen);
		return elementRef;
	};
}
//#endregion
//#region node_modules/@react-leaflet/core/lib/dom.js
var import_leaflet_src = require_leaflet_src();
function splitClassName(className) {
	return className.split(" ").filter(Boolean);
}
function addClassName(element, className) {
	for (const cls of splitClassName(className)) import_leaflet_src.DomUtil.addClass(element, cls);
}
//#endregion
//#region node_modules/@react-leaflet/core/lib/element.js
function createElementObject(instance, context, container) {
	return Object.freeze({
		instance,
		context,
		container
	});
}
function createElementHook(createElement, updateElement) {
	if (updateElement == null) return function useImmutableLeafletElement(props, context) {
		const elementRef = (0, import_react.useRef)(void 0);
		if (!elementRef.current) elementRef.current = createElement(props, context);
		return elementRef;
	};
	return function useMutableLeafletElement(props, context) {
		const elementRef = (0, import_react.useRef)(void 0);
		if (!elementRef.current) elementRef.current = createElement(props, context);
		const propsRef = (0, import_react.useRef)(props);
		const { instance } = elementRef.current;
		(0, import_react.useEffect)(function updateElementProps() {
			if (propsRef.current !== props) {
				updateElement(instance, props, propsRef.current);
				propsRef.current = props;
			}
		}, [
			instance,
			props,
			updateElement
		]);
		return elementRef;
	};
}
//#endregion
//#region node_modules/@react-leaflet/core/lib/layer.js
function useLayerLifecycle(element, context) {
	(0, import_react.useEffect)(function addLayer() {
		(context.layerContainer ?? context.map).addLayer(element.instance);
		return function removeLayer() {
			context.layerContainer?.removeLayer(element.instance);
			context.map.removeLayer(element.instance);
		};
	}, [context, element]);
}
function createLayerHook(useElement) {
	return function useLayer(props) {
		const context = useLeafletContext();
		const elementRef = useElement(withPane(props, context), context);
		useAttribution(context.map, props.attribution);
		useEventHandlers(elementRef.current, props.eventHandlers);
		useLayerLifecycle(elementRef.current, context);
		return elementRef;
	};
}
//#endregion
//#region node_modules/@react-leaflet/core/lib/path.js
function usePathOptions(element, props) {
	const optionsRef = (0, import_react.useRef)(void 0);
	(0, import_react.useEffect)(function updatePathOptions() {
		if (props.pathOptions !== optionsRef.current) {
			const options = props.pathOptions ?? {};
			element.instance.setStyle(options);
			optionsRef.current = options;
		}
	}, [element, props]);
}
function createPathHook(useElement) {
	return function usePath(props) {
		const context = useLeafletContext();
		const elementRef = useElement(withPane(props, context), context);
		useEventHandlers(elementRef.current, props.eventHandlers);
		useLayerLifecycle(elementRef.current, context);
		usePathOptions(elementRef.current, props);
		return elementRef;
	};
}
//#endregion
//#region node_modules/@react-leaflet/core/lib/generic.js
function createControlComponent(createInstance) {
	function createElement(props, context) {
		return createElementObject(createInstance(props), context);
	}
	return createLeafComponent(createControlHook(createElementHook(createElement)));
}
function createLayerComponent(createElement, updateElement) {
	return createContainerComponent(createLayerHook(createElementHook(createElement, updateElement)));
}
function createOverlayComponent(createElement, useLifecycle) {
	return createDivOverlayComponent(createDivOverlayHook(createElementHook(createElement), useLifecycle));
}
function createPathComponent(createElement, updateElement) {
	return createContainerComponent(createPathHook(createElementHook(createElement, updateElement)));
}
function createTileLayerComponent(createElement, updateElement) {
	return createLeafComponent(createLayerHook(createElementHook(createElement, updateElement)));
}
//#endregion
//#region node_modules/@react-leaflet/core/lib/grid-layer.js
function updateGridLayer(layer, props, prevProps) {
	const { opacity, zIndex } = props;
	if (opacity != null && opacity !== prevProps.opacity) layer.setOpacity(opacity);
	if (zIndex != null && zIndex !== prevProps.zIndex) layer.setZIndex(zIndex);
}
//#endregion
//#region node_modules/@react-leaflet/core/lib/media-overlay.js
function updateMediaOverlay(overlay, props, prevProps) {
	if (props.bounds instanceof import_leaflet_src.LatLngBounds && props.bounds !== prevProps.bounds) overlay.setBounds(props.bounds);
	if (props.opacity != null && props.opacity !== prevProps.opacity) overlay.setOpacity(props.opacity);
	if (props.zIndex != null && props.zIndex !== prevProps.zIndex) overlay.setZIndex(props.zIndex);
}
//#endregion
//#region node_modules/react-leaflet/lib/hooks.js
function useMap() {
	return useLeafletContext().map;
}
function useMapEvent(type, handler) {
	const map = useMap();
	(0, import_react.useEffect)(function addMapEventHandler() {
		map.on(type, handler);
		return function removeMapEventHandler() {
			map.off(type, handler);
		};
	}, [
		map,
		type,
		handler
	]);
	return map;
}
function useMapEvents(handlers) {
	const map = useMap();
	(0, import_react.useEffect)(function addMapEventHandlers() {
		map.on(handlers);
		return function removeMapEventHandlers() {
			map.off(handlers);
		};
	}, [map, handlers]);
	return map;
}
//#endregion
//#region node_modules/react-leaflet/lib/AttributionControl.js
var AttributionControl = createControlComponent(function createAttributionControl(props) {
	return new import_leaflet_src.Control.Attribution(props);
});
//#endregion
//#region node_modules/react-leaflet/lib/Circle.js
var Circle = createPathComponent(function createCircle({ center, children: _c, ...options }, ctx) {
	const circle = new import_leaflet_src.Circle(center, options);
	return createElementObject(circle, extendContext(ctx, { overlayContainer: circle }));
}, updateCircle);
//#endregion
//#region node_modules/react-leaflet/lib/CircleMarker.js
var CircleMarker = createPathComponent(function createCircleMarker({ center, children: _c, ...options }, ctx) {
	const marker = new import_leaflet_src.CircleMarker(center, options);
	return createElementObject(marker, extendContext(ctx, { overlayContainer: marker }));
}, updateCircle);
//#endregion
//#region node_modules/react-leaflet/lib/FeatureGroup.js
var FeatureGroup = createPathComponent(function createFeatureGroup({ children: _c, ...options }, ctx) {
	const group = new import_leaflet_src.FeatureGroup([], options);
	return createElementObject(group, extendContext(ctx, {
		layerContainer: group,
		overlayContainer: group
	}));
});
//#endregion
//#region node_modules/react-leaflet/lib/GeoJSON.js
var GeoJSON = createPathComponent(function createGeoJSON({ data, ...options }, ctx) {
	const geoJSON = new import_leaflet_src.GeoJSON(data, options);
	return createElementObject(geoJSON, extendContext(ctx, { overlayContainer: geoJSON }));
}, function updateGeoJSON(layer, props, prevProps) {
	if (props.style !== prevProps.style) if (props.style == null) layer.resetStyle();
	else layer.setStyle(props.style);
});
//#endregion
//#region node_modules/react-leaflet/lib/ImageOverlay.js
var ImageOverlay = createLayerComponent(function createImageOverlay({ bounds, url, ...options }, ctx) {
	const overlay = new import_leaflet_src.ImageOverlay(url, bounds, options);
	return createElementObject(overlay, extendContext(ctx, { overlayContainer: overlay }));
}, function updateImageOverlay(overlay, props, prevProps) {
	updateMediaOverlay(overlay, props, prevProps);
	if (props.bounds !== prevProps.bounds) {
		const bounds = props.bounds instanceof import_leaflet_src.LatLngBounds ? props.bounds : new import_leaflet_src.LatLngBounds(props.bounds);
		overlay.setBounds(bounds);
	}
	if (props.url !== prevProps.url) overlay.setUrl(props.url);
});
//#endregion
//#region node_modules/react-leaflet/lib/LayerGroup.js
var LayerGroup = createLayerComponent(function createLayerGroup({ children: _c, ...options }, ctx) {
	const group = new import_leaflet_src.LayerGroup([], options);
	return createElementObject(group, extendContext(ctx, { layerContainer: group }));
});
var LayersControl = createContainerComponent(createControlHook(createElementHook(function createLayersControl({ children: _c, ...options }, ctx) {
	const control = new import_leaflet_src.Control.Layers(void 0, void 0, options);
	return createElementObject(control, extendContext(ctx, { layersControl: control }));
}, function updateLayersControl(control, props, prevProps) {
	if (props.collapsed !== prevProps.collapsed) if (props.collapsed === true) control.collapse();
	else control.expand();
})));
function createControlledLayer(addLayerToControl) {
	return function ControlledLayer(props) {
		const parentContext = useLeafletContext();
		const propsRef = (0, import_react.useRef)(props);
		const [layer, setLayer] = (0, import_react.useState)(null);
		const { layersControl, map } = parentContext;
		const addLayer = (0, import_react.useCallback)((layerToAdd) => {
			if (layersControl != null) {
				if (propsRef.current.checked) map.addLayer(layerToAdd);
				addLayerToControl(layersControl, layerToAdd, propsRef.current.name);
				setLayer(layerToAdd);
			}
		}, [
			addLayerToControl,
			layersControl,
			map
		]);
		const removeLayer = (0, import_react.useCallback)((layerToRemove) => {
			layersControl?.removeLayer(layerToRemove);
			setLayer(null);
		}, [layersControl]);
		const context = (0, import_react.useMemo)(() => {
			return extendContext(parentContext, { layerContainer: {
				addLayer,
				removeLayer
			} });
		}, [
			parentContext,
			addLayer,
			removeLayer
		]);
		(0, import_react.useEffect)(() => {
			if (layer !== null && propsRef.current !== props) {
				if (props.checked === true && (propsRef.current.checked == null || propsRef.current.checked === false)) map.addLayer(layer);
				else if (propsRef.current.checked === true && (props.checked == null || props.checked === false)) map.removeLayer(layer);
				propsRef.current = props;
			}
		});
		return props.children ? /* @__PURE__ */ import_react.createElement(LeafletContext, { value: context }, props.children) : null;
	};
}
LayersControl.BaseLayer = createControlledLayer(function addBaseLayer(layersControl, layer, name) {
	layersControl.addBaseLayer(layer, name);
});
LayersControl.Overlay = createControlledLayer(function addOverlay(layersControl, layer, name) {
	layersControl.addOverlay(layer, name);
});
//#endregion
//#region node_modules/react-leaflet/lib/MapContainer.js
function MapContainerComponent({ bounds, boundsOptions, center, children, className, id, placeholder, style, whenReady, zoom, ...options }, forwardedRef) {
	const [props] = (0, import_react.useState)({
		className,
		id,
		style
	});
	const [context, setContext] = (0, import_react.useState)(null);
	const mapInstanceRef = (0, import_react.useRef)(void 0);
	(0, import_react.useImperativeHandle)(forwardedRef, () => context?.map ?? null, [context]);
	const mapRef = (0, import_react.useCallback)((node) => {
		if (node !== null && !mapInstanceRef.current) {
			const map = new import_leaflet_src.Map(node, options);
			mapInstanceRef.current = map;
			if (center != null && zoom != null) map.setView(center, zoom);
			else if (bounds != null) map.fitBounds(bounds, boundsOptions);
			if (whenReady != null) map.whenReady(whenReady);
			setContext(createLeafletContext(map));
		}
	}, []);
	(0, import_react.useEffect)(() => {
		return () => {
			context?.map.remove();
		};
	}, [context]);
	const contents = context ? /* @__PURE__ */ import_react.createElement(LeafletContext, { value: context }, children) : placeholder ?? null;
	return /* @__PURE__ */ import_react.createElement("div", {
		...props,
		ref: mapRef
	}, contents);
}
var MapContainer = /* @__PURE__ */ (0, import_react.forwardRef)(MapContainerComponent);
//#endregion
//#region node_modules/react-leaflet/lib/Marker.js
var Marker = createLayerComponent(function createMarker({ position, ...options }, ctx) {
	const marker = new import_leaflet_src.Marker(position, options);
	return createElementObject(marker, extendContext(ctx, { overlayContainer: marker }));
}, function updateMarker(marker, props, prevProps) {
	if (props.position !== prevProps.position) marker.setLatLng(props.position);
	if (props.icon != null && props.icon !== prevProps.icon) marker.setIcon(props.icon);
	if (props.zIndexOffset != null && props.zIndexOffset !== prevProps.zIndexOffset) marker.setZIndexOffset(props.zIndexOffset);
	if (props.opacity != null && props.opacity !== prevProps.opacity) marker.setOpacity(props.opacity);
	if (marker.dragging != null && props.draggable !== prevProps.draggable) if (props.draggable === true) marker.dragging.enable();
	else marker.dragging.disable();
});
//#endregion
//#region node_modules/react-leaflet/lib/Pane.js
var DEFAULT_PANES = [
	"mapPane",
	"markerPane",
	"overlayPane",
	"popupPane",
	"shadowPane",
	"tilePane",
	"tooltipPane"
];
function omitPane(obj, pane) {
	const { [pane]: _p, ...others } = obj;
	return others;
}
function createPane(name, props, context) {
	if (DEFAULT_PANES.indexOf(name) !== -1) throw new Error(`You must use a unique name for a pane that is not a default Leaflet pane: ${name}`);
	if (context.map.getPane(name) != null) throw new Error(`A pane with this name already exists: ${name}`);
	const parentPaneName = props.pane ?? context.pane;
	const parentPane = parentPaneName ? context.map.getPane(parentPaneName) : void 0;
	const element = context.map.createPane(name, parentPane);
	if (props.className != null) addClassName(element, props.className);
	if (props.style != null) for (const key of Object.keys(props.style)) element.style[key] = props.style[key];
	return element;
}
function PaneComponent(props, forwardedRef) {
	const [paneName] = (0, import_react.useState)(props.name);
	const [paneElement, setPaneElement] = (0, import_react.useState)(null);
	(0, import_react.useImperativeHandle)(forwardedRef, () => paneElement, [paneElement]);
	const context = useLeafletContext();
	const newContext = (0, import_react.useMemo)(() => ({
		...context,
		pane: paneName
	}), [context]);
	(0, import_react.useEffect)(() => {
		setPaneElement(createPane(paneName, props, context));
		return function removeCreatedPane() {
			context.map.getPane(paneName)?.remove?.();
			if (context.map._panes != null) {
				context.map._panes = omitPane(context.map._panes, paneName);
				context.map._paneRenderers = omitPane(context.map._paneRenderers, paneName);
			}
		};
	}, []);
	return props.children != null && paneElement != null ? /* @__PURE__ */ (0, import_react_dom.createPortal)(/* @__PURE__ */ import_react.createElement(LeafletContext, { value: newContext }, props.children), paneElement) : null;
}
var Pane = /* @__PURE__ */ (0, import_react.forwardRef)(PaneComponent);
//#endregion
//#region node_modules/react-leaflet/lib/Polygon.js
var Polygon = createPathComponent(function createPolygon({ positions, ...options }, ctx) {
	const polygon = new import_leaflet_src.Polygon(positions, options);
	return createElementObject(polygon, extendContext(ctx, { overlayContainer: polygon }));
}, function updatePolygon(layer, props, prevProps) {
	if (props.positions !== prevProps.positions) layer.setLatLngs(props.positions);
});
//#endregion
//#region node_modules/react-leaflet/lib/Polyline.js
var Polyline = createPathComponent(function createPolyline({ positions, ...options }, ctx) {
	const polyline = new import_leaflet_src.Polyline(positions, options);
	return createElementObject(polyline, extendContext(ctx, { overlayContainer: polyline }));
}, function updatePolyline(layer, props, prevProps) {
	if (props.positions !== prevProps.positions) layer.setLatLngs(props.positions);
});
//#endregion
//#region node_modules/react-leaflet/lib/Popup.js
var Popup = createOverlayComponent(function createPopup(props, context) {
	return createElementObject(new import_leaflet_src.Popup(props, context.overlayContainer), context);
}, function usePopupLifecycle(element, context, { position }, setOpen) {
	(0, import_react.useEffect)(function addPopup() {
		const { instance } = element;
		function onPopupOpen(event) {
			if (event.popup === instance) {
				instance.update();
				setOpen(true);
			}
		}
		function onPopupClose(event) {
			if (event.popup === instance) setOpen(false);
		}
		context.map.on({
			popupopen: onPopupOpen,
			popupclose: onPopupClose
		});
		if (context.overlayContainer == null) {
			if (position != null) instance.setLatLng(position);
			instance.openOn(context.map);
		} else context.overlayContainer.bindPopup(instance);
		return function removePopup() {
			context.map.off({
				popupopen: onPopupOpen,
				popupclose: onPopupClose
			});
			context.overlayContainer?.unbindPopup();
			context.map.removeLayer(instance);
		};
	}, [
		element,
		context,
		setOpen,
		position
	]);
});
//#endregion
//#region node_modules/react-leaflet/lib/Rectangle.js
var Rectangle = createPathComponent(function createRectangle({ bounds, ...options }, ctx) {
	const rectangle = new import_leaflet_src.Rectangle(bounds, options);
	return createElementObject(rectangle, extendContext(ctx, { overlayContainer: rectangle }));
}, function updateRectangle(layer, props, prevProps) {
	if (props.bounds !== prevProps.bounds) layer.setBounds(props.bounds);
});
//#endregion
//#region node_modules/react-leaflet/lib/ScaleControl.js
var ScaleControl = createControlComponent(function createScaleControl(props) {
	return new import_leaflet_src.Control.Scale(props);
});
var useSVGOverlay = createLayerHook(createElementHook(function createSVGOverlay(props, context) {
	const { attributes, bounds, ...options } = props;
	const container = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	container.setAttribute("xmlns", "http://www.w3.org/2000/svg");
	if (attributes != null) for (const name of Object.keys(attributes)) container.setAttribute(name, attributes[name]);
	return createElementObject(new import_leaflet_src.SVGOverlay(container, bounds, options), context, container);
}, updateMediaOverlay));
function SVGOverlayComponent({ children, ...options }, forwardedRef) {
	const { instance, container } = useSVGOverlay(options).current;
	(0, import_react.useImperativeHandle)(forwardedRef, () => instance);
	return container == null || children == null ? null : /* @__PURE__ */ (0, import_react_dom.createPortal)(children, container);
}
var SVGOverlay = /* @__PURE__ */ (0, import_react.forwardRef)(SVGOverlayComponent);
//#endregion
//#region node_modules/react-leaflet/lib/TileLayer.js
var TileLayer = createTileLayerComponent(function createTileLayer({ url, ...options }, context) {
	return createElementObject(new import_leaflet_src.TileLayer(url, withPane(options, context)), context);
}, function updateTileLayer(layer, props, prevProps) {
	updateGridLayer(layer, props, prevProps);
	const { url } = props;
	if (url != null && url !== prevProps.url) layer.setUrl(url);
});
//#endregion
//#region node_modules/react-leaflet/lib/Tooltip.js
var Tooltip = createOverlayComponent(function createTooltip(props, context) {
	return createElementObject(new import_leaflet_src.Tooltip(props, context.overlayContainer), context);
}, function useTooltipLifecycle(element, context, { position }, setOpen) {
	(0, import_react.useEffect)(function addTooltip() {
		const container = context.overlayContainer;
		if (container == null) return;
		const { instance } = element;
		const onTooltipOpen = (event) => {
			if (event.tooltip === instance) {
				if (position != null) instance.setLatLng(position);
				instance.update();
				setOpen(true);
			}
		};
		const onTooltipClose = (event) => {
			if (event.tooltip === instance) setOpen(false);
		};
		container.on({
			tooltipopen: onTooltipOpen,
			tooltipclose: onTooltipClose
		});
		container.bindTooltip(instance);
		return function removeTooltip() {
			container.off({
				tooltipopen: onTooltipOpen,
				tooltipclose: onTooltipClose
			});
			if (container._map != null) container.unbindTooltip();
		};
	}, [
		element,
		context,
		setOpen,
		position
	]);
});
//#endregion
//#region node_modules/react-leaflet/lib/VideoOverlay.js
var VideoOverlay = createLayerComponent(function createVideoOverlay({ bounds, url, ...options }, ctx) {
	const overlay = new import_leaflet_src.VideoOverlay(url, bounds, options);
	if (options.play === true) overlay.getElement()?.play();
	return createElementObject(overlay, extendContext(ctx, { overlayContainer: overlay }));
}, function updateVideoOverlay(overlay, props, prevProps) {
	updateMediaOverlay(overlay, props, prevProps);
	if (typeof props.url === "string" && props.url !== prevProps.url) overlay.setUrl(props.url);
	const video = overlay.getElement();
	if (video != null) {
		if (props.play === true && !prevProps.play) video.play();
		else if (!props.play && prevProps.play === true) video.pause();
	}
});
//#endregion
//#region node_modules/react-leaflet/lib/WMSTileLayer.js
var WMSTileLayer = createTileLayerComponent(function createWMSTileLayer({ eventHandlers: _eh, params = {}, url, ...options }, context) {
	return createElementObject(new import_leaflet_src.TileLayer.WMS(url, {
		...params,
		...withPane(options, context)
	}), context);
}, function updateWMSTileLayer(layer, props, prevProps) {
	updateGridLayer(layer, props, prevProps);
	if (props.params != null && props.params !== prevProps.params) layer.setParams(props.params);
});
//#endregion
//#region node_modules/react-leaflet/lib/ZoomControl.js
var ZoomControl = createControlComponent(function createZoomControl(props) {
	return new import_leaflet_src.Control.Zoom(props);
});
//#endregion
export { AttributionControl, Circle, CircleMarker, FeatureGroup, GeoJSON, ImageOverlay, LayerGroup, LayersControl, MapContainer, Marker, Pane, Polygon, Polyline, Popup, Rectangle, SVGOverlay, ScaleControl, TileLayer, Tooltip, VideoOverlay, WMSTileLayer, ZoomControl, useMap, useMapEvent, useMapEvents };

//# sourceMappingURL=react-leaflet.js.map