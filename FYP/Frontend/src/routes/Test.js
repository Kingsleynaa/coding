import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr'
import jwtDecode from 'jwt-decode'
import React from 'react'
import { useState, useEffect } from 'react'

export const Test = () => {
  console.log(jwtDecode(localStorage.getItem("token")))

  const [connection, setConnection] = useState(null)
  const [inputText, setInputText] = useState("")

  useEffect(() => {
    const connect = new HubConnectionBuilder()
      .withUrl(`${process.env.REACT_APP_API_SERVER}/hubs/notifications`, { accessTokenFactory: () => `${localStorage.getItem("token")}` })
      .withAutomaticReconnect()
      .build();

    setConnection(connect);
  }, []);

  useEffect(() => {
    if (connection) {
      connection
        .start()
        .then(() => {
          connection.on("NewNotification", (message) => {
            console.log(message)
          });
        })
        .catch((error) => console.log(error));
    }
  }, [connection]);

  return (
    <div>Test</div>
  )
}

