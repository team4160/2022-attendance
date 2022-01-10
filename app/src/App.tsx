import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import './App.scss';

const onChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setter: React.Dispatch<React.SetStateAction<any>>
): void  =>{
  if (e.target.type === 'checkbox') setter(e.target.checked);
  else setter(e.target.value);
};

const onKeyPressFob = (e: React.KeyboardEvent<HTMLInputElement>, focusIfTrue: React.RefObject<HTMLElement>, callIfTrue: () => void): void => {
  if (e.key === 'Enter') {
    if (focusIfTrue !== null) {
      const node = focusIfTrue.current;
      if (node) node.focus();
      callIfTrue();
    }
  }
};

let serverCredentials: {
  orgId: string,
  attendancePeriodId: string
} = {
  orgId: '',
  attendancePeriodId: ''
};

const App: () => JSX.Element = () => {
  const [ statusText, setStatusText ] = useState<string>('');
  const [ serverAddress, setServerAddress ] = useState<string>('');

  const [ name, setName ] = useState<string>('');
  const [ fob, setFob ] = useState<string>('');
  const [ login, setLogin ] = useState<string>('');
  const [ setupMode, setSetupMode ] = useState<boolean>(false);
  const [ clearNameAndFob, setClearNameAndFob ] = useState<number>(0);
  const [ submitCredentials, setSubmitCredentials ] = useState<number>(0);
  const [ userStatusText, setUserStatusText ] = useState<string>('');
  const [ sID, setSID ] = useState<string>('');
  const nameRef = useRef<HTMLInputElement>(null);
  const loginRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      axios.get(`${serverAddress}/credentials`).then((result) => {
        if (result.status === 200) {
          setStatusText('Server connected');
          serverCredentials = result.data;
        }
        else {
          setStatusText('Server address not valid');
        }
      }).catch(() => {
        setStatusText('Server address not valid');
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [ serverAddress ]);
  useEffect(() => {
    if (setupMode) {
      axios.post(`${serverAddress}/graphql`, {
        query: `
          mutation registerAttendanceMember {
            registerAttendanceMember(data: {
              organizationId: "${serverCredentials.orgId}",
              firstName: "${name}",
              lastName: "Last Name",
              rolesIds: [],
              identifications: [
                "${fob}",
                "${sID}"
              ]
            }) {
              firstName
            }
          }
        `
      }).then((r) => {
        console.log(r);
        setUserStatusText(`Member registered: ${r.data.data.registerAttendanceMember.firstName}`);
      });
    }
    setName('');
    setFob('');
    setSID('');
  }, [ clearNameAndFob ]);
  useEffect(() => {
    axios.post(`${serverAddress}/graphql`, {
      query: `
      mutation logAttendance {
        logAttendance(data: {
          identifier: "${login}",
          attendancePeriodId: "${serverCredentials.attendancePeriodId}"
        })
      }
      `
    }).then((r) => {
      console.log(r);
      const result = r.data.data.logAttendance;
      if (result === 'NF') {
        setUserStatusText('User not found');
      }
      else setUserStatusText(`Attendance logged: ${r.data.data.logAttendance}`);
    });
    setLogin('');
    loginRef?.current?.focus();
  }, [ submitCredentials ]);

  return (
    <div className="app">
      <h1>Team 4160 Attendance</h1>
      <h3>{statusText}</h3>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 120, 119, 0.3)'
      }}>
        <hr />
        <p style={{ textAlign: 'center', margin: '1rem 10rem' }}>Do <span style={{ textDecoration: 'underline' }}>not</span> touch the area highlighted in red unless you know what you're doing.
      Misuse of this menu could result in the loss of all attendance data (jk I'm not that stupid but it will cause me a lot of annoyance and time to fix)</p>
        <div>
          <label>Setup mode</label>
          <input type="checkbox" checked={setupMode} onChange={(e) => onChange(e, setSetupMode)} />
        </div>
        <input type="text" value={serverAddress} onChange={(e) => onChange(e, setServerAddress)} placeholder='Server address'/>
        <input type="text" value={name} onChange={(e) => onChange(e, setName)} ref={nameRef} placeholder='First name'/>
        <input type="text" value={sID} onChange={(e) => onChange(e, setSID)} placeholder='School ID'/>
        <input type="text" value={fob} onChange={(e) => onChange(e, setFob)} onKeyDown={(e) => onKeyPressFob(e, nameRef, () => {setClearNameAndFob(clearNameAndFob + 1);})} placeholder='Scan key fob'/>
        <hr />
      </div>
      <input style={{
        width: '20rem',
        margin: '2rem'
      }} type="text" value={login} onChange={(e) => onChange(e, setLogin)} ref={loginRef} onKeyDown={(e) => onKeyPressFob(e, loginRef, () => {setSubmitCredentials(submitCredentials + 1);})} placeholder='Attendance credentials (keyfob)'/>
      <h3>{userStatusText}</h3>
    </div>
  );
};

export default App;
