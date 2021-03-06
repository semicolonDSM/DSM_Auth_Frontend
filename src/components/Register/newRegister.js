import * as s from "./newStyle";

import React, { useEffect, useState, useRef, useDebugValue } from "react";

import axios from "axios";

import { useHistory } from "react-router-dom";

import Loading from "../Public/Loading/Loading";
import { useCookies } from "react-cookie";

// 비번 확인 됨
// 인증번호 확인 성공
// 아이디 중복 체크 성공

const NewRegister = React.memo(() => {
  const [Acookie, Aset] = useCookies(["access-token"]);
  const [Rcookie, Rset] = useCookies(["refresh-token"]);
  const history = useHistory();
  const [value, setValue] = useState({
    email: "",
    id: "",
    code: "",
    psw: "",
    checkPsw: "",
    name: "",
  });
  const [state, setState] = useState({
    psw: false,
    id: false,
  });
  const [count, setCount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eLoading, setELoading] = useState(false);
  const [idLoading, setIdLoading] = useState(false);
  const timer = useRef();
  const check = useRef();
  const pw = useRef();
  const pw2 = useRef();
  const id1 = useRef();
  const idjung = useRef();
  const number = useRef();
  const email1 = useRef();
  const name1 = useRef();
  const box = useRef();
  // 처음 비번 / 두번째 인증코드 / 세번째 ???

  // 인풋값 받기
  const InputVal = (e) => {
    const { name } = e.target;
    switch (name) {
      case "id":
        id1.current.classList.remove("red");
        break;
      case "psw":
        pw.current.classList.remove("red");
        break;
      case "code":
        number.current.classList.remove("red");
        break;
      case "checkPsw":
        pw2.current.classList.remove("red");
        break;
      case "name":
        name1.current.classList.remove("red");
        break;
      case "email":
        email1.current.classList.remove("red");
        break;
    }
    if (name === "id") {
      setState({ ...state, id: false });
      setIdLoading(false);
    }
    if (name === "email") {
      setELoading(false);
    }
    if (name === "name" && e.target.value === "성예인") {
      window.location.href = "http://sung.surge.sh/";
    }
    setValue({
      ...value,
      [name]: e.target.value,
    });
  };

  useEffect(() => {
    if (value.psw === value.checkPsw && value.psw !== "") {
      pw2.current.classList.remove("red");
      setState({
        ...state,
        psw: true,
      });
    } else {
      pw2.current.classList.add("red");
      setState({
        ...state,
        psw: false,
      });
    }
  }, [value]);

  // 회원가입 확인 버튼
  const register = () => {
    const { id, psw, name, email, code, checkPsw } = value;
    if (
      state.id === true &&
      state.psw === true &&
      id !== "" &&
      name !== "" &&
      psw !== "" &&
      email !== "" &&
      code !== "" &&
      checkPsw !== ""
    ) {
      setLoading(true);
      axios({
        url: "/auth/signup",
        method: "post",
        data: {
          id,
          password: psw,
          name,
          email,
          authcode: code,
        },
      })
        .then(() => {
          alert("회원가입 성공 !");
          const redirect_url = process.env.REACT_APP_REDIRECT_URL;
          const client_id = process.env.REACT_APP_CLIENT_ID;
          axios({
            url: "/dsmauth/login",
            method: "post",
            data: {
              id: value.id,
              password: value.psw,
              redirect_url,
              client_id,
            },
          })
            .then((res) => {
              const code = res.data.location.split("?code=")[1];
              const client_id = process.env.REACT_APP_CLIENT_ID;
              const client_secret = process.env.REACT_APP_CLIENT_SECRET;
              axios({
                method: "post",
                url: "/dsmauth/token",
                data: {
                  code,
                  client_id,
                  client_secret,
                },
              })
                .then((res) => {
                  Aset("access-token", res.data["access-token"], {
                    expires: new Date(Date.now() + 1000 * 60 * 60 * 2),
                  });
                  Rset("refresh-token", res.data["refresh-token"], {
                    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
                  });
                  history.push("/");
                })
                .catch((err) => {
                  history.push("/");
                });
            })
            .catch((err) => {
              console.log("login error");
              history.push("/");
            });
        })
        .catch((err) => {
          switch (err.response.status) {
            case 401:
              alert("코드가 잘못되었습니다.");
              number.current.classList.add("red");
              break;
            case 404:
              alert("이메일을 다시 확인해주세요");
              email1.current.classList.add("red");
              break;
            default:
              alert("요청 오류");
          }
          setLoading(false);
        });
    } else {
      alert("모든 양식을 마쳐주세요!");
      if (value.id === "") {
        id1.current.classList.add("red");
      }
      if (value.psw === "") {
        pw.current.classList.add("red");
      } else if (state.psw === false) {
        pw2.current.classList.add("red");
      }
      if (value.name === "") {
        name1.current.classList.add("red");
      }
      if (state.id === false) {
        idjung.current.classList.add("red");
      }
      if (value.code === "") {
        number.current.classList.add("red");
      }
      if (value.email === "") {
        email1.current.classList.add("red");
      }
      if (!check.current.checked) {
        box.current.style.border = "1px solid red";
      }
    }
  };

  useEffect(() => {
    if (count <= 0) {
      clearInterval(timer.current);
      setCount(false);
    }
  }, [count]);

  // 이메일 인증코드 받기
  const EmailCheck = () => {
    if (value.email === "") {
      alert("이메일을 입력하세요.");
      return;
    } else if (
      !/^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i.test(
        value.email
      )
    ) {
      alert("이메일 양식이 맞지 않습니다.");
      return;
    } else if (count > 0) {
      alert("아직 인증번호를 다시 받을 수 없습니다.");
      return;
    } else if (eLoading === true) {
      alert("이메일 발송 중 입니다.");
      return;
    }
    setELoading(true);
    axios({
      url: "/auth/email",
      method: "post",
      data: {
        email: value.email.replace(" "),
      },
    })
      .then(() => {
        alert("인증번호를 보냈습니다.");
        setCount(30);
        timer.current = setInterval(() => {
          setCount((prev) => prev - 1);
        }, 1000);
      })
      .catch((err) => {
        setELoading(false);
        if (err.response.data.code === 403) {
          alert("이미 회원가입한 이메일입니다.");
        } else {
          alert("인증코드 발송에 실패했습니다. 이메일을 확인하세요.");
        }
      });
  };

  // 아이디 중복 체크 함수
  const checkId = () => {
    if (value.id === "") {
      alert("아이디를 입력해주세요");
      return;
    }
    if (state.id === true) {
      alert("이미 확인된 아이디 입니다.");
      return;
    }
    if (idLoading === true) {
      alert("아이디 체크중 입니다.");
      return;
    }
    setIdLoading(true);
    axios({
      method: "post",
      url: "/auth/check/id",
      data: {
        id: value.id,
      },
    })
      .then((res) => {
        alert("아이디가 사용 가능합니다 !");
        idjung.current.classList.remove("red");
        setState({
          ...state,
          id: true,
        });
      })
      .catch((err) => {
        setIdLoading(false);
        switch (err.response.status) {
          case 405:
            alert("아이디가 중복됩니다 !");
            break;
          default:
            alert("요청 오류");
        }
      });
  };

  return (
    <s.Wrapper>
      {loading && <Loading isOn={loading} />}
      <s.Container>
        <s.SignUp>SIGN UP</s.SignUp>
        <s.InputWrapper>
          <s.Input
            placeholder="인증할 이메일을 입력해주세요."
            onChange={InputVal}
            name="email"
            value={value.email}
            type="email"
            ref={email1}
          />
          <s.InputBtn onClick={EmailCheck}>인증코드 받기</s.InputBtn>
        </s.InputWrapper>
        <s.SingUpDes
          style={count === false ? { color: "#42a54a" } : { color: "tomato" }}
        >
          {value.email === ""
            ? ""
            : count === false
            ? "인증번호를 받을 수 있습니다."
            : `${count}초 뒤 인증코드를 다시 받을 수 있습니다.`}
        </s.SingUpDes>
        <s.InputWrapper>
          <s.Input
            placeholder="인증번호를 입력해주세요."
            onChange={InputVal}
            name="code"
            value={value.code}
            style={{ width: "100%" }}
            type="number"
            ref={number}
          />
        </s.InputWrapper>
        <s.InputWrapper>
          <s.Input
            placeholder="사용할 아이디를 입력해주세요."
            onChange={InputVal}
            name="id"
            value={value.id}
            type="id"
            ref={id1}
          />
          <s.InputBtn onClick={checkId} ref={idjung}>
            중복확인
          </s.InputBtn>
        </s.InputWrapper>
        <s.SingUpDes>
          {value.id === ""
            ? ""
            : !state.id
            ? "아이디 중복을 확인해주세요!"
            : "아이디를 사용할 수 있습니다."}
        </s.SingUpDes>
        <s.InputWrapper style={{ marginTop: "2%" }}>
          <s.Input
            placeholder="사용하실 비밀번호를 입력해주세요."
            style={{ width: "100%" }}
            type="password"
            onChange={InputVal}
            name="psw"
            value={value.psw}
            ref={pw}
          />
        </s.InputWrapper>
        <s.InputWrapper>
          <s.Input
            placeholder="비밀번호를 확인하세요."
            style={{ width: "100%" }}
            type="password"
            onChange={InputVal}
            name="checkPsw"
            value={value.checkPsw}
            ref={pw2}
          />
        </s.InputWrapper>
        <s.SingUpDes
          style={state.psw ? { color: "#42a54a" } : { color: "tomato" }}
        >
          {value.psw === "" && value.checkPsw === ""
            ? ""
            : state.psw
            ? "비밀번호가 확인되었습니다!"
            : "비밀번호가 맞지 않습니다!"}
        </s.SingUpDes>
        <s.InputWrapper style={{ marginTop: "2%" }}>
          <s.Input
            placeholder="성함을 입력하세요."
            onChange={InputVal}
            name="name"
            value={value.name}
            style={{ width: "100%" }}
            type="text"
            ref={name1}
          />
        </s.InputWrapper>
        <s.Agree
          target="_blank"
          href="https://semicolondsm.github.io/imformation/"
        >
          개인정보 수집 이용 동의
          <s.CheckBox id="asd" type="checkbox" ref={check} />
          <s.Label
            htmlFor="asd"
            ref={box}
            onClick={() => (box.current.style.border = "none")}
          />
        </s.Agree>
        <s.BtnWrapper>
          <s.Btn onClick={() => history.goBack()}>취소</s.Btn>
          <s.Btn onClick={register}>확인</s.Btn>
        </s.BtnWrapper>
      </s.Container>
    </s.Wrapper>
  );
});

export default NewRegister;
