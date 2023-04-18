import React, { useState } from "react";
import * as yup from "yup";
import { Formik } from "formik";

const SignUp = () => {

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [email, setEmail] = useState("");
    const [idFileFront, setIdFileFront] = useState(null);
    const [idFileBack, setIdFileBack] = useState(null);

    // voir quelle valeur limite il faut mettre pour ce genre de fichier
    const FILE_SIZE_LIMIT = 40 * 1048576; //https://stackoverflow.com/questions/5697605/limit-the-size-of-a-file-upload-html-input-element
    const SUPPORTED_FORMATS = ["application/pdf", "image/jpeg", "image/png"];

    const schema = yup.object().shape({
        idFileFront: yup.mixed()
            .nullable(false)
            .required("Une pièce d'identité recto est nécessaire")
            .test('fileSize', "la taille du fichier est trop gros" + " : 40 MB max", value => !value || value.size <= FILE_SIZE_LIMIT)
            .test('fileType', "Le type du fichier doit être un pdf, jpg ou un pdg", value => !value || SUPPORTED_FORMATS.includes(value.type))
        ,
        idFileBack: yup.mixed()
            .nullable(false)
            .required("Une pièce d'identité verso est nécessaire")
            .test('fileSize', "la taille du fichier est trop gros", value => !value || value.size <= FILE_SIZE_LIMIT)
            .test('fileType', "Le type du fichier doit être un pdf, jpg ou un pdg", value => !value || SUPPORTED_FORMATS.includes(value.type)),

        email: yup.string().email("Cet email n'est pas valide").required("Ce champ est obligatoire !"),

        // password : 

    });


    return <div>hello from sign in</div>
};

export default SignUp;