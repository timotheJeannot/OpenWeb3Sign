import React, { useContext, useState } from "react";
import * as yup from "yup";
import { Formik } from "formik";
import { Button, Form, FormGroup } from "react-bootstrap";
import userSocketService from "../../service/socket/user-socket.service";
import { SocketContext } from "../../context/socket";


const SignIn = () => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const socket = useContext(SocketContext);

    const schema = yup.object().shape({
        email: yup.string().email("Cet email n'est pas valide").required("Ce champ est obligatoire !"),

        password: yup
            .string()
            .required("Le mot de passe est obligatoire")
            .matches(
                /^.*(?=.{8,})((?=.*[!@#$%^&*()\-_=+{};:,<.>]){1})(?=.*\d)((?=.*[a-z]){1})((?=.*[A-Z]){1}).*$/,
                "Le mot de passe doit contenir au moins 8 caractères, une majuscule, un nombre et un caractère spécial"
            )
    });

    const onChangeEmail = (e) => {
        setEmail(e.target.value);
    };

    const onChangePassword = (e) => {
        setPassword(e.target.value);
    };

    const handleSignIn = () => {
        console.log("handle sign in");
        
        const dataToSend = {
            email : email,
            password : password
        }
        userSocketService.signIn(socket,dataToSend).then(response => {
            console.log(response);
            localStorage.setItem("user", JSON.stringify(response));
            window.location.replace("/profile"); // on utilise pas useNavigate pour que App puisse changer d'état et set la socket
        }).catch(err => {
            console.error(err);
        })

    };

    return <div>
        <h1 className="text-center">Connexion</h1>
        <Formik
            initialValues={{
                password: password,
                email: email,
            }}
            validationSchema={schema}
            onSubmit={handleSignIn}
            enableReinitialize={true}
        >
            {({
                handleSubmit,
                handleChange,
                handleBlur,
                submitForm,
                validateForm,
                setFieldValue,
                values,
                touched,
                isValid,
                errors

            }) => (
                <Form noValidate
                    onSubmit={(e) => { e.preventDefault(); handleSubmit(e) }}
                    className="mb-3"
                >
                    <FormGroup className="mb-3" controlId="formEmailId">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            name="email"
                            placeholder="Quel est votre email ?"
                            value={values.email}
                            onChange={(e) => {
                                handleChange(e);
                                onChangeEmail(e);
                            }}
                            onBlur={handleBlur}
                            isInvalid={touched.email && !!errors.email}
                            isValid={touched.email && !errors.email}
                        />
                        <Form.Control.Feedback>
                        </Form.Control.Feedback>
                        <Form.Control.Feedback type="invalid">
                            {errors.email}
                        </Form.Control.Feedback>
                    </FormGroup>

                    <FormGroup className="mb-3" controlId="formPasswordId">
                        <Form.Label>Mot de passe</Form.Label>
                        <Form.Control
                            type="password"
                            name="password"
                            placeholder="Quel est votre mot de passe ?"
                            value={values.password}
                            onChange={(e) => {
                                handleChange(e);
                                onChangePassword(e);
                            }}
                            onBlur={handleBlur}
                            isInvalid={touched.password && !!errors.password}
                            isValid={touched.password && !errors.password}
                        />
                        <Form.Control.Feedback>
                            C'est un bon mot de passe, gardez le pour vous !
                        </Form.Control.Feedback>
                        <Form.Control.Feedback type="invalid">
                            {errors.password}
                        </Form.Control.Feedback>
                    </FormGroup>


                    <Button variant="success"
                        type="submit"
                        className="d-block mx-auto mt-3 mb-3"
                        // https://github.com/formium/formik/issues/1796 
                        onMouseDown={(event) => { event.preventDefault() }}
                    >
                        Connexion
                    </Button>
                </Form>
            )}

        </Formik>
    </div>
};

export default SignIn;