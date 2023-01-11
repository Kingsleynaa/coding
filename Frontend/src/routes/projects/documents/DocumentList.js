import React, { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { SIDEBAR_TABS } from '../../../components/SidebarProject'
import { setBreadcrumbPath, setSidebarInformation } from '../../../redux/siteSlice'
import axios from 'axios'
import { LayoutSidebar } from '../../../layouts/LayoutSidebar'
import { dateFormatWithTime, fileSizeFormat } from '../../../utils/CommonUtils'
import { Alert } from '../../../components/Alert'
import $ from "jquery"

const SORTING_OPTIONS = {
  "Uploaded Date (Newest First)": "DATE_DESC",
  "Uploaded Date (Oldest First)": "DATE_ASC"
}

export const DocumentList = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { projectId } = useParams()
  const [projectDetails, setProjectDetails] = useState({})

  const [documents, setDocuments] = useState([])
  const [documentTypes, setDocumentTypes] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [documentSort, setDocumentSort] = useState(SORTING_OPTIONS["Uploaded Date (Newest First)"])

  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState([])
  const fileUploadInput = useRef()

  const [selectedDocumentType, setSelectedDocumentType] = useState({
    "id": "ALL",
    "name": "ALL"
  })

  // Handling drag events
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type == "dragenter" || e.type == "dragover") {
      setDragActive(true)
    } else if (e.type == "dragleave") {
      setDragActive(false)
    }
  }

  // Triggers when file is selected with click
  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  // Triggers when file is dropped
  const handleDrop = function (e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Triggers the input when the button is clicked
  const onButtonClick = () => {
    fileUploadInput.current.click();
  };

  // Handler when file is dropped
  const handleFiles = (uploadedFiles) => {
    let fileArray = []

    for (var uploadedFile of uploadedFiles) {
      if (uploadedFile.size > 10000000) {
        $("#file-errors").append(
          Alert(`${uploadedFile.name} exceeds the file size limit of 10 MB.`, 'danger')
        )
      } else {
        fileArray.push(uploadedFile)
      }
    }

    setFiles(prevState => prevState.concat(fileArray))
  }

  const removeFile = (index) => {
    let prevState = files.slice(0)
    prevState.splice(index, 1)
    setFiles(prevState)
  }

  useEffect(() => {
    console.log(files)
  }, [files])

  useEffect(() => {
    const loadPageData = async () => {
      let projectDetailsResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}`)
      let projectDetails = projectDetailsResponse.data

      setProjectDetails(projectDetails)

      // Setting the breadcrumb path
      dispatch(setBreadcrumbPath({
        [projectDetails["name"]]: `/projects/${projectDetails["id"]}`,
        "Documents": ``,
      }))

      dispatch(setSidebarInformation({
        "name": projectDetails["name"],
        "dateProjectedStart": projectDetails["dateProjectedStart"],
        "dateProjectedEnd": projectDetails["dateProjectedEnd"],
        "active": SIDEBAR_TABS.DOCUMENTS
      }))

      let documentTypesResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/documents/types`)
      setDocumentTypes(documentTypesResponse.data)
      setSelectedDocumentType({
        "id": "ALL",
        "name": "ALL"
      })
    }

    loadPageData()
    searchDocuments()
  }, [])

  // Search
  useEffect(() => {
    searchDocuments()
  }, [selectedDocumentType, searchQuery, documentSort])

  const searchDocuments = async () => {
    let searchResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/documents/${projectId}/search?scope=${selectedDocumentType["id"]}&query=${searchQuery}&sort=${documentSort}`)
    setDocuments(searchResponse.data)
  }

  const documentTypeRef = useRef()

  const uploadFiles = async () => {
    if (files.length == 0) {
      alert("There are no files to be uploaded.")
      return
    }

    let data = new FormData()

    data.append("projectId", projectId)
    data.append("documentTypeId", documentTypeRef.current.value)

    for (var file of files) {
      data.append("files", file)
    }

    let response = await axios.post(`${process.env.REACT_APP_API_SERVER}/api/projects/documents`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })

    if (response.status == 200) {
      setFiles([])
      searchDocuments()
    }
  }

  const selectDocument = (index) => {
    let currentDocuments = documents.slice()

    if (projectDetails["isCompleted"]) {
      return
    }

    if (currentDocuments[index].selected == null || currentDocuments[index].selected == undefined) {
      currentDocuments[index].selected = true
      setDocuments(currentDocuments)
      return
    }

    currentDocuments[index].selected = !currentDocuments[index].selected
    setDocuments(currentDocuments)
  }

  useEffect(() => {
    for (let i of documents) {
      if (i.selected) {
        setRemoveButtonDisabled(false)
        return
      }
    }

    setRemoveButtonDisabled(true)
  }, [documents])

  const deleteDocuments = async () => {
    let documentsToBeDeleted = documents.filter(x => x.selected).map(x => x.id)

    let data = {
      "documentIdList": documentsToBeDeleted,
      "projectId": projectId
    }

    console.log(data)

    let deleteDocumentsResponse = await axios.delete(`${process.env.REACT_APP_API_SERVER}/api/projects/documents`,
      {
        data: data
      }
    )

    searchDocuments()
  }

  const [removeButtonDisabled, setRemoveButtonDisabled] = useState(true)

  return (
    <LayoutSidebar>
      <div className="d-flex justify-content-between border-bottom flex-wrap">
        <div className="d-flex order-sm-2 order-md-1 order-lg-1 flex-grow-1 flex-md-grow-1">
          <span className={`nav-link font-sm milestones-scope text-dark ${selectedDocumentType["id"] == "ALL" ? "active bold" : ""}`} onClick={e => setSelectedDocumentType({ "id": "ALL", "name": "ALL" })} style={{ cursor: "pointer" }}>All</span>

          {documentTypes.map(value => {
            return (
              <span className={`nav-link font-sm milestones-scope text-dark ${selectedDocumentType["id"] == value["id"] ? "active bold" : ""}`}
                onClick={e => setSelectedDocumentType(value)}
                style={{ cursor: "pointer" }}>
                {value["name"]}
              </span>
            )
          })}

        </div>

        <div className="d-flex order-1 flex-wrap flex-lg-nowrap flex-lg-grow-0 flex-grow-1">
          {!projectDetails["isCompleted"] &&
            <button
              data-bs-toggle="modal"
              data-bs-target="#file-upload-modal"
              className="btn btn-primary no-decoration-on-hover my-1 font-sm pt-2 flex-grow-1 h-wrap-content align-self-center"
              style={{ whiteSpace: "nowrap" }}>
              Upload document
            </button>
          }
        </div>
      </div>

      <div className='action-bar border-bottom mb-2 py-2 d-flex justify-content-between'>
        {!projectDetails["isCompleted"] &&
          <button className='btn btn-danger font-sm h-wrap-content' disabled={removeButtonDisabled} data-bs-toggle="modal" data-bs-target="#delete-modal">Remove</button>
        }

        <div className='d-flex'>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className='form-control font-sm w-auto h-wrap-content me-2' placeholder='Search'></input>
          <select className='form-select font-sm h-wrap-content w-auto' onChange={e => setDocumentSort(e.target.value)}>
            {Object.keys(SORTING_OPTIONS).map(value => {
              return (
                <option value={SORTING_OPTIONS[value]}>{value}</option>
              )
            })}
          </select>
        </div>
      </div>

      <div class="modal fade" id="delete-modal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h6 class="modal-title" id="exampleModalLabel">Are you sure?</h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body font-sm">
              You're about to permamently delete the following documents from the project. <span className='bold'>This process is irreversible.</span>
              <br />
              <br />

              <ul className='font-sm'>
                {documents.map(value => {
                  if (value.selected) {
                    return (<li>{value["fileName"]}</li>)
                  }
                })}

              </ul>

            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-dark font-sm" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger font-sm" data-bs-dismiss="modal" onClick={deleteDocuments}>Delete documents</button>
            </div>
          </div>
        </div>
      </div>

      {/* Documents */}
      {documents.map((value, index) => {
        return (
          <div className={`document p-2 rounded ${value.selected ? "bg-light" : ""}`} onClick={e => selectDocument(index)}>
            <div className="row justify-content-between">
              <div className="col-12 col-lg-3">
                <form className={`${projectDetails["isCompleted"] ? "" : "form-check"}`}>
                  {!projectDetails["isCompleted"] &&
                    <input type="checkbox" checked={value.selected} className="form-check-input mt-2" />
                  }

                  <div className={`form-check-label ${projectDetails["isCompleted"] ? "" : "ms-3"}`}>
                    <a download={true} style={{ wordBreak: "break-all" }} onClick={e => selectDocument(index)} href={`${process.env.REACT_APP_API_SERVER}/api/projects/documents/${value["id"]}/download`} className="my-0 bold font-sm text-dark">{value["fileName"]}</a>

                    <p className="my-0 font-sm text-secondary">Uploaded by {value["uploadedByUserName"]}</p>
                  </div>

                </form>
              </div>

              <div className="col-12 col-lg-4">
                <span className='badge rounded-pill bg-light text-dark' style={{ fontWeight: 500 }}>{value["documentTypeName"]}</span>
              </div>

              <div className="col-12 col-lg-3">
                <span className='font-sm text-secondary'>Uploaded on {dateFormatWithTime(value["dateUploaded"])}</span>
              </div>

              <div className="col-12 col-lg-2 text-end">
                <a download={true} onClick={e => selectDocument(index)} href={`${process.env.REACT_APP_API_SERVER}/api/projects/documents/${value["id"]}/download`} className='btn btn-outline-dark font-sm h-wrap-content no-decoration-on-hover'>Download</a>
              </div>
            </div>
          </div>
        )
      })}

      {/* File upload modal */}
      <div class="modal fade" id="file-upload-modal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h6 class="modal-title" id="exampleModalLabel">Document upload</h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">

              <div className='mb-3'>
                <label className="form-label font-sm">Document types</label>
                <select className='form-select font-sm' ref={documentTypeRef}>

                  {documentTypes.map(value => {
                    return (
                      <option value={value["id"]}>{value["name"]}</option>
                    )
                  })}

                </select>
              </div>

              <div className='mb-3' id='file-errors'></div>

              <div onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`rounded border p-3 mb-2 ${dragActive ? "drag-active" : ""}`}
              >
                <input type="file"
                  onChange={e => handleChange(e)}
                  className='d-none'
                  ref={fileUploadInput}
                  multiple={true}>
                </input>

                <label id="label-file-upload" htmlFor="input-file-upload">

                  <div>
                    <p className='font-sm'>Drag and drop your files here or</p>
                    <button className='btn btn-outline-dark font-sm' onClick={onButtonClick}>Upload a file</button>
                  </div>

                </label>
              </div>

              {files.map((value, index) => {
                return (
                  <div className='justify-content-between d-flex uploaded-file p-1' key={index}>
                    <p className='font-sm mb-0'>{value["name"]}</p>
                    <div className='d-flex'>
                      <p className='font-sm me-3 mb-0'>{fileSizeFormat(value["size"])}</p>
                      <i className='fa fa-trash text-danger align-self-center' style={{ cursor: "pointer" }} onClick={e => removeFile(index)}></i>
                    </div>
                  </div>
                )
              })}


            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-dark font-sm" data-bs-dismiss="modal">Close</button>
              <button type="button" class="btn btn-primary font-sm" data-bs-dismiss="modal" onClick={uploadFiles}>Upload</button>
            </div>
          </div>
        </div>
      </div>


    </LayoutSidebar>
  )
}
