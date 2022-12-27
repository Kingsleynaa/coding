
import React, { useEffect, useState, useRef } from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";


export const GenerateReport = () => {
    const { projectId } = useParams()
    const [latestLink, setLatestLink] = useState(null)
    
    
    const getAzureLink = async () => {
        let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/azure-dev-ops/${projectId}/Generate-Report`)
        if (response.status == 200) {
            let latestLink = response.data
            setLatestLink(response.data)


            return latestLink;
        }
        return latestLink;
    }

    function loadLink() { 
        document.getElementById('texto').innerHTML = "Successfully generated report. You can view it here:";
        getAzureLink()

    }

    return (
        <>
            <div className="card mb-4 bg-light">
                <div className="card-body">
                    <button id="report" onClick={loadLink}>Generate Report</button>
                </div>
                <p id="texto"></p>
                <a href={latestLink} target="_blank">{latestLink}</a>
            </div>
        </>
    )
}
