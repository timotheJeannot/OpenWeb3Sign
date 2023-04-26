
import React, { useEffect, useRef, useState } from "react";
import { Image } from "react-bootstrap";

import "./OW3SImage.css";

// OW3SImage n'affiche que des images carrés pour l'instant, c'est pour cela qu'on a que props.size et pas props.width ou props.height
const OW3SImage = (props) => {

    const [errored, setErrored] = useState(false);
    const [src, setSrc] = useState(undefined)
    const [portrait, setPortrait] = useState("");
    const [width, setWidth] = useState(undefined);
    const [height, setHeight] = useState(undefined);
    const [oldWidth, setOldWidth] = useState(undefined);
    const [oldHeight, setOldHeight] = useState(undefined);
    const [borderRadius, setBorderRadius] = useState(undefined);
    const [fullscreen, setFullscreen] = useState(false);
    const refContainer = useRef(null);
    const refImg = useRef(null);

    const onError = () => {
        if (!errored) {
            setSrc("data/img/website/image-not-found.png");
            setErrored(true);
        }
    };

    useEffect(() => {
        setSrc(props.src);
    }, [props.src]);

    useEffect(() => {
        if (props.roundedCircle) {
            setBorderRadius("50%")
        } else {
            setBorderRadius(undefined);
        }
    }, [props.roundedCircle]);

    useEffect(() => {
        let isCancelled = false;
        document.addEventListener("fullscreenchange", (ev) => {
            if (!isCancelled && !document.fullscreenElement) {
                setFullscreen(false);
            }
        });
        return () => {
            isCancelled = true;
        }
    }, []);

    useEffect(() => {
        if (refContainer && refContainer.current && fullscreen && !document.fullscreenElement) { // la dernière condition est là car avec le setFullScreen du listener fullscreenchange on repasse ici une seconde fois et on obtient une erreur dans la console
            refContainer.current.requestFullscreen();
        }
        if (refImg && refImg.current && fullscreen) {
            setHeight("100%");
            setWidth("100%");
        }
        if (!fullscreen) {
            setWidth(oldWidth);
            setHeight(oldHeight);
        }
    }, [fullscreen]);


    const onLoadImage = (e) => {
        if (!props.noSquare) {
            if (e.target.offsetWidth > e.target.offsetHeight) {
                setWidth(props.size);
                setHeight(undefined);
                setOldWidth(props.size);
                setOldHeight(undefined);
                setPortrait("");
            }
            else {
                setHeight(props.size);
                setWidth(undefined);
                setOldWidth(undefined);
                setOldHeight(props.size);
                setPortrait(" portrait");
            }
        } else {
            if (e.target.offsetWidth > e.target.offsetHeight) {
                if (props.size && props.size < e.target.offsetWidth) {
                    let factorResize = e.target.offsetWidth / props.size;
                    setWidth(props.size);
                    setHeight(e.target.offsetHeight / factorResize);
                    setOldWidth(props.size);
                    setOldHeight(e.target.offsetHeight / factorResize);
                }
                else {
                    setWidth(e.target.offsetWidth);
                    setHeight(e.target.offsetHeight);
                    setOldWidth(e.target.offsetWidth);
                    setOldHeight(e.target.offsetHeight);
                }
            }
            else {
                if (props.size && props.size < e.target.offsetHeight) {
                    let factorResize = e.target.offsetHeight / props.size;
                    setWidth(e.target.offsetWidth / factorResize);
                    setHeight(props.size);
                    setOldWidth(e.target.offsetWidth / factorResize);
                    setOldHeight(props.size);
                }
                else {
                    setWidth(e.target.offsetWidth);
                    setHeight(e.target.offsetHeight);
                    setOldWidth(e.target.offsetWidth);
                    setOldHeight(e.target.offsetHeight);
                }
            }
        }

    };

    const onClickImage = (e) => {
        if (props.onClick) {
            props.onClick(e);
        } else {
            if (!fullscreen) {
                setFullscreen(true);
            }
        }
    };

    const onMouseDownImage = () => {
        if (props.onMouseDown) {
            props.onMouseDown();
        }
    }

    const onMouseUpImage = () => {
        if (props.onMouseUp) {
            props.onMouseUp();
        }
    }

    const render = () => {
        if (props.noSquare || fullscreen) {
            // refaire un if avec fullscreen comme condition, car il y a trop de fullscreen? value1: value2 testé ici
            return <div
                className={!fullscreen ? props.className + " containerImage" : "containerImage"}
                style={{ width: width, height: height }}
                ref={refContainer}
                onClick={onClickImage}
                onMouseDown={onMouseDownImage}
                onMouseUp={onMouseUpImage}
                onMouseEnter={props.onMouseEnter}
                onMouseLeave={props.onMouseLeave}
            >
                <Image
                    src={src}
                    onError={onError}
                    onLoad={onLoadImage}
                    width={width}
                    height={height}
                    ref={refImg}
                    style={{ borderRadius: fullscreen ? null : borderRadius, objectFit: "contain" }}
                    className={fullscreen ? "mx-auto d-block" : ""}
                />
                {fullscreen &&
                    <Image
                        src="data/img/website/close.png"
                        className="position-fixed top-0 end-0 border border-dark p-2 bg-white"
                        style={{ width: 50, height: 50, borderRadius: "50%" }}
                        onClick={() => { document.exitFullscreen(); }}
                    />
                }
            </div>
        }
        //https://jonathannicol.com/blog/2014/06/16/centre-crop-thumbnails-with-css/
        return <div
            className={props.className + " thumbnail"}
            style={{ width: props.size, height: props.size, borderRadius: borderRadius }}
            onClick={onClickImage}
            onMouseDown={onMouseDownImage}
            onMouseUp={onMouseUpImage}
            onMouseEnter={props.onMouseEnter}
            onMouseLeave={props.onMouseLeave}
        >
            <Image
                src={src}
                onError={onError}
                className={portrait}
                onLoad={onLoadImage}
                width={width}
                height={height}
            />
        </div>
    }

    return render()
}

export default OW3SImage