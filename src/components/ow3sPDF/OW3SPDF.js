import React, { useEffect, useRef, useState } from "react";
import "./OW3SPDF.css";

import PDFObject from "pdfobject";
import OW3SImage from "../ow3simage/OW3SImage";

const OW3SPDF = (props) => {
    //https://pdfobject.com/static/
    //https://pdfobject.com/#browser-support

    const [src, setSrc] = useState(undefined);
    const [fullScreen, setFullScreen] = useState(false);
    const [supportedEmbed, setSupportedEmbed] = useState(false);
    const refContainer = useRef(null);

    useEffect(() => {
        //le warning suivant semble normal
        //Warning: Invalid absolute docBaseUrl:
        // si on ouvre un pdf depuis le navigateur avec une url du style : file:///path_to_ur_local_pdf
        // on obtient encore ce warning
        setSrc(URL.createObjectURL(props.file))
        if (PDFObject.supportsPDFs) {
            setSupportedEmbed(true)
        }
        else {
            // mobiles are not supported we use react pdf
            setSupportedEmbed(false);
        }
    }, [props.file]);

    const makeFullScreen = () => {
        refContainer.current.requestFullscreen();
        setFullScreen(true);
    }

    const exitFullScreen = () => {
        document.exitFullscreen();
        setFullScreen(false);
    }

    const render = () => {
        if (src) {
            if (supportedEmbed) {
                return <div className={"OW3S_PDF_Container " + props.className}
                ref={refContainer}
                style={props.style}
                >
                    <div className="border-bottom border-dark d-flex bg-secondary bg-gradiant ">
                        {fullScreen ?
                            <OW3SImage
                                src="data/img/website/minimize.png"
                                className="ms-auto "
                                onClick={exitFullScreen}
                                size={30}
                            />
                            :
                            <OW3SImage
                                src="data/img/website/fullscreen.png"
                                className="ms-auto "
                                onClick={makeFullScreen}
                                size={30}
                            />
                        }
                    </div>

                    <object
                        data={src}
                        title={props.file.name}
                        className="OW3S_PDF_object"
                    >
                        {/* fallback on n'est pas censé atterrir ici car on vérifie avant (avec PDFObject.supportsPDFs) que le navigateur supporte cela  */}
                        <p><b>Le pdf n'a pas pus être afficher</b></p>
                    </object>
                </div>
            } else {
                // here we can try to use react pdf
                return <div>Le pdf n'a pas pus être afficher, https://pdfobject.com/#browser-support</div>
            }
        }
        return <div>props file missing</div>
    };

    return render();

}

export default OW3SPDF;