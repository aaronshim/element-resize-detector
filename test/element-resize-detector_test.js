/* global describe:false, it:false, beforeEach:false, expect:false, elementResizeDetectorMaker:false, _:false, $:false, jasmine:false */

"use strict";

//This messed with tests in IE8.
//jasmine.getFixtures().fixturesPath = "/base/test/";

function ensureMapEqual(before, after, ignore) {
    var beforeKeys = _.keys(before);
    var afterKeys = _.keys(after);

    var unionKeys = _.union(beforeKeys, afterKeys);

    var diffValueKeys = _.filter(unionKeys, function(key) {
        var beforeValue = before[key];
        var afterValue = after[key];
        return !ignore(key, beforeValue, afterValue) && beforeValue !== afterValue;
    });

    if(diffValueKeys.length) {
        var beforeDiffObject = {};
        var afterDiffObject = {};

        _.forEach(diffValueKeys, function(key) {
            beforeDiffObject[key] = before[key];
            afterDiffObject[key] = after[key];
        });

        expect(afterDiffObject).toEqual(beforeDiffObject);
    }
}

function getStyle(element) {
    function clone(styleObject) {
        var clonedTarget = {};
        _.forEach(styleObject.cssText.split(";").slice(0, -1), function(declaration){
            var colonPos = declaration.indexOf(":");
            var attr = declaration.slice(0, colonPos).trim();
            if(attr.indexOf("-") === -1){ // Remove attributes like "background-image", leaving "backgroundImage"
                clonedTarget[attr] = declaration.slice(colonPos+2);
            }
        });
        return clonedTarget;
    }

    var style = getComputedStyle(element);
    return clone(style);
}

var ensureStyle = ensureMapEqual;

function positonFromStaticToRelative(key, before, after) {
    return key === "position" && before === "static" && after === "relative";
}

function getAttributes(element) {
    var attrs = {};
    _.forEach(element.attributes, function(attr) {
        attrs[attr.nodeName] = attr.nodeValue;
    });
    return attrs;
}

var ensureAttributes = ensureMapEqual;

var reporter = {
    log: function() {
        throw new Error("Reporter.log should not be called");
    },
    warn: function() {
        throw new Error("Reporter.warn should not be called");
    },
    error: function() {
        throw new Error("Reporter.error should not be called");
    }
};

$("body").prepend("<div id=fixtures></div>");

function listenToTest(strategy) {
    describe("[" + strategy + "] listenTo", function() {
        it("should be able to attach a listener to an element", function(done) {
            var erd = elementResizeDetectorMaker({
                callOnAdd: false,
                reporter: reporter,
                strategy: strategy
            });

            var listener = jasmine.createSpy("listener");

            erd.listenTo($("#test")[0], listener);

            setTimeout(function() {
                $("#test").width(300);
            }, 200);

            setTimeout(function() {
                expect(listener).toHaveBeenCalledWith($("#test")[0]);
                done();
            }, 400);
        });

        it("should throw on invalid parameters", function() {
            var erd = elementResizeDetectorMaker({
                callOnAdd: false,
                reporter: reporter,
                strategy: strategy
            });

            expect(erd.listenTo).toThrow();

            expect(_.partial(erd.listenTo, $("#test")[0])).toThrow();
        });

        describe("option.onReady", function() {
            it("should be called when installing a listener to an element", function(done) {
                var erd = elementResizeDetectorMaker({
                    callOnAdd: false,
                    reporter: reporter,
                    strategy: strategy
                });

                var listener = jasmine.createSpy("listener");

                erd.listenTo({
                    onReady: function() {
                        $("#test").width(200);
                        setTimeout(function() {
                            expect(listener).toHaveBeenCalledWith($("#test")[0]);
                            done();
                        }, 200);
                    }
                }, $("#test")[0], listener);
            });

            it("should be called when all elements are ready", function(done) {
                var erd = elementResizeDetectorMaker({
                    callOnAdd: false,
                    reporter: reporter,
                    strategy: strategy
                });

                var listener = jasmine.createSpy("listener");

                erd.listenTo({
                    onReady: function() {
                        $("#test").width(200);
                        $("#test2").width(300);
                        setTimeout(function() {
                            expect(listener).toHaveBeenCalledWith($("#test")[0]);
                            expect(listener).toHaveBeenCalledWith($("#test2")[0]);
                            done();
                        }, 200);
                    }
                }, $("#test, #test2"), listener);
            });

            it("should be able to handle listeners for the same element but different calls", function(done) {
                var erd = elementResizeDetectorMaker({
                    callOnAdd: false,
                    reporter: reporter,
                    strategy: strategy
                });

                var onReady1 = jasmine.createSpy("listener");
                var onReady2 = jasmine.createSpy("listener");

                erd.listenTo({
                    onReady: onReady1
                }, $("#test"), function noop() {});
                erd.listenTo({
                    onReady: onReady2
                }, $("#test"), function noop() {});

                setTimeout(function() {
                    expect(onReady1.calls.count()).toBe(1);
                    expect(onReady2.calls.count()).toBe(1);
                    done();
                }, 300);
            });

            it("should be able to handle when elements occur multiple times in the same call (and other calls)", function(done) {
                var erd = elementResizeDetectorMaker({
                    callOnAdd: false,
                    reporter: reporter,
                    strategy: strategy
                });

                var onReady1 = jasmine.createSpy("listener");
                var onReady2 = jasmine.createSpy("listener");

                erd.listenTo({
                    onReady: onReady1
                }, [$("#test")[0], $("#test")[0]], function noop() {});
                erd.listenTo({
                    onReady: onReady2
                }, $("#test"), function noop() {});

                setTimeout(function() {
                    expect(onReady1.calls.count()).toBe(1);
                    expect(onReady2.calls.count()).toBe(1);
                    done();
                }, 300);
            });
        });

        it("should be able to attach multiple listeners to an element", function(done) {
            var erd = elementResizeDetectorMaker({
                callOnAdd: false,
                reporter: reporter,
                strategy: strategy
            });

            var listener1 = jasmine.createSpy("listener1");
            var listener2 = jasmine.createSpy("listener2");

            erd.listenTo($("#test")[0], listener1);
            erd.listenTo($("#test")[0], listener2);

            setTimeout(function() {
                $("#test").width(300);
            }, 200);

            setTimeout(function() {
                expect(listener1).toHaveBeenCalledWith($("#test")[0]);
                expect(listener2).toHaveBeenCalledWith($("#test")[0]);
                done();
            }, 400);
        });

        it("should be able to attach a listener to an element multiple times within the same call", function(done) {
            var erd = elementResizeDetectorMaker({
                callOnAdd: false,
                reporter: reporter,
                strategy: strategy
            });

            var listener1 = jasmine.createSpy("listener1");

            erd.listenTo([$("#test")[0], $("#test")[0]], listener1);

            setTimeout(function() {
                $("#test").width(300);
            }, 200);

            setTimeout(function() {
                expect(listener1).toHaveBeenCalledWith($("#test")[0]);
                expect(listener1.calls.count()).toBe(2);
                done();
            }, 400);
        });

        it("should be able to attach listeners to multiple elements", function(done) {
            var erd = elementResizeDetectorMaker({
                callOnAdd: false,
                reporter: reporter,
                strategy: strategy
            });

            var listener1 = jasmine.createSpy("listener1");

            erd.listenTo($("#test, #test2"), listener1);

            setTimeout(function() {
                $("#test").width(200);
            }, 200);

            setTimeout(function() {
                expect(listener1).toHaveBeenCalledWith($("#test")[0]);
            }, 400);

            setTimeout(function() {
                $("#test2").width(500);
            }, 600);

            setTimeout(function() {
               expect(listener1).toHaveBeenCalledWith($("#test2")[0]);
               done();
            }, 800);
        });

        //Only run this test if the browser actually is able to get the computed style of an element.
        //Only IE8 is lacking the getComputedStyle method.
        if(window.getComputedStyle) {
            it("should keep the style of the element intact", function(done) {
                var erd = elementResizeDetectorMaker({
                    callOnAdd: false,
                    reporter: reporter,
                    strategy: strategy
                });

                var before = getStyle($("#test")[0]);
                erd.listenTo($("#test")[0], _.noop);
                var after = getStyle($("#test")[0]);
                ensureStyle(before, after, positonFromStaticToRelative);

                //Test styles async since making an element listenable is async.
                setTimeout(function() {
                    var afterAsync = getStyle($("#test")[0]);
                    ensureStyle(before, afterAsync, positonFromStaticToRelative);
                    done();
                }, 200);
            });
        }

        describe("options.callOnAdd", function() {
            it("should be true default and call all functions when listenTo succeeds", function(done) {
                var erd = elementResizeDetectorMaker({
                    reporter: reporter,
                    strategy: strategy
                });

                var listener = jasmine.createSpy("listener");
                var listener2 = jasmine.createSpy("listener2");

                erd.listenTo($("#test")[0], listener);
                erd.listenTo($("#test")[0], listener2);

                setTimeout(function() {
                    expect(listener).toHaveBeenCalledWith($("#test")[0]);
                    expect(listener2).toHaveBeenCalledWith($("#test")[0]);
                    listener.calls.reset();
                    listener2.calls.reset();
                    $("#test").width(300);
                }, 200);

                setTimeout(function() {
                    expect(listener).toHaveBeenCalledWith($("#test")[0]);
                    expect(listener2).toHaveBeenCalledWith($("#test")[0]);
                    done();
                }, 400);
            });

            it("should call listener multiple times when listening to multiple elements", function(done) {
                var erd = elementResizeDetectorMaker({
                    reporter: reporter,
                    strategy: strategy
                });

                var listener1 = jasmine.createSpy("listener1");
                erd.listenTo($("#test, #test2"), listener1);

                setTimeout(function() {
                    expect(listener1).toHaveBeenCalledWith($("#test")[0]);
                    expect(listener1).toHaveBeenCalledWith($("#test2")[0]);
                    done();
                }, 200);
            });
        });

        it("should call listener if the element is changed synchronously after listenTo", function(done) {
            var erd = elementResizeDetectorMaker({
                callOnAdd: false,
                reporter: reporter,
                strategy: strategy
            });

            var listener1 = jasmine.createSpy("listener1");
            erd.listenTo($("#test"), listener1);
            $("#test").width(200);

            setTimeout(function() {
                expect(listener1).toHaveBeenCalledWith($("#test")[0]);
                done();
            }, 200);
        });

        it("should not emit resize when listenTo is called", function (done) {
            var erd = elementResizeDetectorMaker({
                callOnAdd: false,
                reporter: reporter,
                strategy: strategy
            });

            var listener1 = jasmine.createSpy("listener1");
            erd.listenTo($("#test"), listener1);

            setTimeout(function() {
                expect(listener1).not.toHaveBeenCalledWith($("#test")[0]);
                done();
            }, 200);
        });

        it("should not emit resize event even though the element is back to its start size", function (done) {
            var erd = elementResizeDetectorMaker({
                callOnAdd: false,
                reporter: reporter,
                strategy: strategy
            });

            var listener = jasmine.createSpy("listener1");
            $("#test").width(200);
            erd.listenTo($("#test"), listener);

            setTimeout(function() {
                expect(listener).not.toHaveBeenCalledWith($("#test")[0]);
                listener.calls.reset();
                $("#test").width(100);
            }, 200);

            setTimeout(function() {
                expect(listener).toHaveBeenCalledWith($("#test")[0]);
                listener.calls.reset();
                $("#test").width(200);
            }, 400);

            setTimeout(function() {
                expect(listener).toHaveBeenCalledWith($("#test")[0]);
                done();
            }, 600);
        });

        it("should use the option.idHandler if present", function(done) {
            var ID_ATTR = "some-fancy-id-attr";

            var idHandler = {
                get: function(element) {
                    if(element[ID_ATTR] === undefined) {
                        var id;

                        if($(element).attr("id") === "test") {
                            id = "test+1";
                        } else if($(element).attr("id") === "test2") {
                            id = "test2+2";
                        }

                        $(element).attr(ID_ATTR, id);
                    }

                    return $(element).attr(ID_ATTR);
                }
            };

            var erd = elementResizeDetectorMaker({
                idHandler: idHandler,
                callOnAdd: false,
                reporter: reporter,
                strategy: strategy
            });

            var listener1 = jasmine.createSpy("listener1");
            var listener2 = jasmine.createSpy("listener1");

            var attrsBeforeTest = getAttributes($("#test")[0]);
            var attrsBeforeTest2 = getAttributes($("#test2")[0]);

            erd.listenTo($("#test"), listener1);
            erd.listenTo($("#test, #test2"), listener2);

            var attrsAfterTest = getAttributes($("#test")[0]);
            var attrsAfterTest2 = getAttributes($("#test2")[0]);

            var ignoreValidIdAttrAndStyle = function(key) {
                return key === ID_ATTR || key === "style";
            };

            ensureAttributes(attrsBeforeTest, attrsAfterTest, ignoreValidIdAttrAndStyle);
            ensureAttributes(attrsBeforeTest2, attrsAfterTest2, ignoreValidIdAttrAndStyle);

            expect($("#test").attr(ID_ATTR)).toEqual("test+1");
            expect($("#test2").attr(ID_ATTR)).toEqual("test2+2");

            setTimeout(function() {
                $("#test").width(300);
                $("#test2").width(500);
            }, 200);

            setTimeout(function() {
               expect(listener1).toHaveBeenCalledWith($("#test")[0]);
               expect(listener2).toHaveBeenCalledWith($("#test")[0]);
               expect(listener2).toHaveBeenCalledWith($("#test2")[0]);
               done();
            }, 600);
        });

        it("should be able to install into elements that are detached from the DOM", function(done) {
            var erd = elementResizeDetectorMaker({
                callOnAdd: false,
                reporter: reporter,
                strategy: strategy
            });

            var listener1 = jasmine.createSpy("listener1");
            var div = document.createElement("div");
            div.style.width = "100%";
            div.style.height = "100%";
            erd.listenTo(div, listener1);

            setTimeout(function () {
                $("#test")[0].appendChild(div);
            }, 200);

            setTimeout(function () {
                $("#test").width(200);
            }, 400);

            setTimeout(function() {
                expect(listener1).toHaveBeenCalledWith(div);
                done();
            }, 600);
        });

        it("should detect resizes caused by padding and font-size changes", function (done) {
            var erd = elementResizeDetectorMaker({
                callOnAdd: false,
                reporter: reporter,
                strategy: strategy
            });

            var listener = jasmine.createSpy("listener");
            $("#test").html("test");
            $("#test").css("padding", "0px");
            $("#test").css("font-size", "16px");

            erd.listenTo($("#test"), listener);

            $("#test").css("padding", "10px");

            setTimeout(function() {
                expect(listener).toHaveBeenCalledWith($("#test")[0]);
                listener.calls.reset();
                $("#test").css("font-size", "20px");
            }, 200);

            setTimeout(function() {
                expect(listener).toHaveBeenCalledWith($("#test")[0]);
                done();
            }, 400);
        });

        describe("should handle unrendered elements correctly", function (done) {
            it("when installing", function (done) {
                var erd = elementResizeDetectorMaker({
                    callOnAdd: false,
                    reporter: reporter,
                    strategy: strategy
                });

                $("#test").html("<div id=\"inner\"></div>");
                $("#test").css("display", "none");

                var listener = jasmine.createSpy("listener");
                erd.listenTo($("#inner"), listener);

                setTimeout(function () {
                    expect(listener).not.toHaveBeenCalled();
                    $("#test").css("display", "");
                }, 200);

                setTimeout(function () {
                    expect(listener).toHaveBeenCalledWith($("#inner")[0]);
                    listener.calls.reset();
                    $("#inner").width("300px");
                }, 400);

                setTimeout(function () {
                    expect(listener).toHaveBeenCalledWith($("#inner")[0]);
                    listener.calls.reset();
                    done();
                }, 600);
            });

            it("when element gets unrendered after installation", function (done) {
                var erd = elementResizeDetectorMaker({
                    callOnAdd: false,
                    reporter: reporter,
                    strategy: strategy
                });

                // The div is rendered to begin with.
                $("#test").html("<div id=\"inner\"></div>");

                var listener = jasmine.createSpy("listener");
                erd.listenTo($("#inner"), listener);

                // The it gets unrendered, and it changes width.
                setTimeout(function () {
                    expect(listener).not.toHaveBeenCalled();
                    $("#test").css("display", "none");
                    $("#inner").width("300px");
                }, 100);

                // Render the element again.
                setTimeout(function () {
                    expect(listener).not.toHaveBeenCalled();
                    $("#test").css("display", "");
                }, 200);

                // ERD should detect that the element has changed size as soon as it gets rendered again.
                setTimeout(function () {
                    expect(listener).toHaveBeenCalledWith($("#inner")[0]);
                    done();
                }, 300);
            });
        });

        it("should handle inline elements correctly", function (done) {
            var erd = elementResizeDetectorMaker({
                callOnAdd: false,
                reporter: reporter,
                strategy: strategy
            });

            $("#test").html("<span id=\"inner\">test</span>");

            var listener = jasmine.createSpy("listener");
            erd.listenTo($("#inner"), listener);

            setTimeout(function () {
                expect(listener).not.toHaveBeenCalled();
                $("#inner").append("testing testing");
            }, 100);

            setTimeout(function () {
                expect(listener).toHaveBeenCalledWith($("#inner")[0]);
                done();
            }, 200);
        });
    });
}

function removalTest(strategy) {
    describe("[" + strategy + "] resizeDetector.removeListener", function() {
        it("should remove listener from element", function(done) {
            var erd = elementResizeDetectorMaker({
                callOnAdd: false,
                strategy: strategy
            });

            var $testElem = $("#test");

            var listenerCall    = jasmine.createSpy("listener");
            var listenerNotCall = jasmine.createSpy("listener");

            erd.listenTo($testElem[0], listenerCall);
            erd.listenTo($testElem[0], listenerNotCall);

            setTimeout(function() {
                erd.removeListener($testElem[0], listenerNotCall);
                $testElem.width(300);
            }, 200);

            setTimeout(function() {
                expect(listenerCall).toHaveBeenCalled();
                expect(listenerNotCall).not.toHaveBeenCalled();
                done();
            }, 400);
        });
    });

    describe("[" + strategy + "] resizeDetector.removeAllListeners", function() {
        it("should remove all listeners from element", function(done) {
            var erd = elementResizeDetectorMaker({
                callOnAdd: false,
                strategy: strategy
            });

            var $testElem = $("#test");

            var listener1 = jasmine.createSpy("listener");
            var listener2 = jasmine.createSpy("listener");

            erd.listenTo($testElem[0], listener1);
            erd.listenTo($testElem[0], listener2);

            setTimeout(function() {
                erd.removeAllListeners($testElem[0]);
                $testElem.width(300);
            }, 200);

            setTimeout(function() {
                expect(listener1).not.toHaveBeenCalled();
                expect(listener2).not.toHaveBeenCalled();
                done();
            }, 400);
        });

        it("should work for elements that don't have the detector installed", function() {
            var erd = elementResizeDetectorMaker({
                strategy: strategy
            });
            var $testElem = $("#test");
            expect(erd.removeAllListeners.bind(erd, $testElem[0])).not.toThrow();
        });
    });

    describe("[" + strategy + "] resizeDetector.uninstall", function() {
        it("should completely remove detector from element", function(done) {
            var erd = elementResizeDetectorMaker({
                callOnAdd: false,
                strategy: strategy
            });

            var $testElem = $("#test");

            var listener = jasmine.createSpy("listener");

            erd.listenTo($testElem[0], listener);

            setTimeout(function() {
                erd.uninstall($testElem[0]);
                // detector element should be removed
                expect($testElem[0].childNodes.length).toBe(0);
                $testElem.width(300);
            }, 200);

            setTimeout(function() {
                expect(listener).not.toHaveBeenCalled();
                done();
            }, 400);
        });
    });
}

describe("element-resize-detector", function() {
    beforeEach(function() {
        //This messed with tests in IE8.
        //TODO: Investigate why, because it would be nice to have instead of the current solution.
        //loadFixtures("element-resize-detector_fixture.html");
        $("#fixtures").html("<div id=test></div><div id=test2></div>");
    });

    describe("elementResizeDetectorMaker", function() {
        it("should be globally defined", function() {
            expect(elementResizeDetectorMaker).toBeFunction();
        });

        it("should create an element-resize-detector instance", function() {
            var erd = elementResizeDetectorMaker();

            expect(erd).toBeObject();
            expect(erd).toHaveMethod("listenTo");
        });
    });

    // listenToTest("object");
    // removalTest("object");
    //
    // //Scroll only supported on non-opera browsers.
    // if(!window.opera) {
    //     listenToTest("scroll");
    //     removalTest("scroll");
    // }

    listenToTest("scroll");
    removalTest("scroll");
});
