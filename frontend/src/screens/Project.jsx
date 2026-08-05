import React, { useState, useEffect, useContext, useRef } from 'react'
import { normalizeFileTree } from '../utils/fileTree.js'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css'
import { getWebContainer } from '../config/webcontainer'


function SyntaxHighlightedCode(props) {
    const ref = useRef(null)

    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-')) {
            hljs.highlightElement(ref.current)

            // hljs won't reprocess the element unless this attribute is removed
            ref.current.removeAttribute('data-highlighted')
        }
    }, [ props.className, props.children ])

    return <code {...props} ref={ref} />
}

// Look up a file inside a nested fileTree using a "folder/file.js" style path
function getFileFromTree(tree, path) {
    if (!tree || !path) return null

    const parts = path.split('/')
    let current = tree

    for (let i = 0; i < parts.length; i++) {
        const part = parts[ i ]
        const isLast = i === parts.length - 1

        if (!current[ part ]) return null

        if (isLast) {
            return current[ part ]
        } else {
            current = current[ part ].directory
        }
    }

    return null
}

// Immutably set a file's contents inside a nested fileTree using a "folder/file.js" style path
function setFileInTree(tree, path, newFileValue) {
    const parts = path.split('/')
    const newTree = { ...tree }
    let current = newTree

    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[ i ]
        current[ part ] = {
            ...current[ part ],
            directory: { ...current[ part ].directory }
        }
        current = current[ part ].directory
    }

    current[ parts[ parts.length - 1 ] ] = newFileValue

    return newTree
}

// Recursively render a nested fileTree in the explorer sidebar
function renderFileTree(tree, onFileClick, path = '') {
    return Object.entries(tree).map(([ name, value ]) => {
        const fullPath = path ? `${path}/${name}` : name

        if (value.directory) {
            return (
                <div key={fullPath} className="pl-2">
                    <p className="font-semibold text-slate-600 px-2 py-1">{name}/</p>
                    <div className="pl-2">
                        {renderFileTree(value.directory, onFileClick, fullPath)}
                    </div>
                </div>
            )
        }

        return (
            <button
                key={fullPath}
                onClick={() => onFileClick(fullPath)}
                className="tree-element cursor-pointer p-2 px-4 flex items-center gap-2 bg-slate-300 w-full">
                <p className='font-semibold text-lg'>{name}</p>
            </button>
        )
    })
}


const Project = () => {

    const location = useLocation()

    const [ isSidePanelOpen, setIsSidePanelOpen ] = useState(false)
    const [ isModalOpen, setIsModalOpen ] = useState(false)
    const [ selectedUserId, setSelectedUserId ] = useState(new Set()) // Initialized as Set
    const [ project, setProject ] = useState(location.state.project)
    const [ message, setMessage ] = useState('')
    const { user } = useContext(UserContext)
    const messageBox = React.createRef()

    const [ users, setUsers ] = useState([])
    const [ messages, setMessages ] = useState([]) // New state variable for messages
    const [ fileTree, setFileTree ] = useState({})

    const [ currentFile, setCurrentFile ] = useState(null)
    const [ openFiles, setOpenFiles ] = useState([])

    const [ webContainer, setWebContainer ] = useState(null)
    const [ iframeUrl, setIframeUrl ] = useState(null)

    const [ runProcess, setRunProcess ] = useState(null)

    // Dynamic run configuration — comes from the AI's response (message.buildCommand /
    // message.startCommand). Defaults to a plain "npm install" + "npm start" for safety,
    // but gets overwritten whenever the AI specifies something else (e.g. "npm run dev"
    // for a Vite app).
    const [ buildCommand, setBuildCommand ] = useState({ mainItem: 'npm', commands: [ 'install' ] })
    const [ startCommand, setStartCommand ] = useState({ mainItem: 'npm', commands: [ 'start' ] })

    const handleUserClick = (id) => {
        setSelectedUserId(prevSelectedUserId => {
            const newSelectedUserId = new Set(prevSelectedUserId);
            if (newSelectedUserId.has(id)) {
                newSelectedUserId.delete(id);
            } else {
                newSelectedUserId.add(id);
            }

            return newSelectedUserId;
        });


    }


    function addCollaborators() {

        axios.put("/projects/add-user", {
            projectId: location.state.project._id,
            users: Array.from(selectedUserId)
        }).then(res => {
            console.log(res.data)
            setIsModalOpen(false)

        }).catch(err => {
            console.log(err)
        })

    }

    const send = () => {

        sendMessage('project-message', {
            message,
            sender: user
        })
        setMessages(prevMessages => [ ...prevMessages, { sender: user, message } ]) // Update messages state
        setMessage("")

    }

    function WriteAiMessage(message) {

        const messageObject = JSON.parse(message)

        return (
            <div
                className='overflow-auto bg-slate-950 text-white rounded-sm p-2'
            >
                <Markdown
                    children={messageObject.text}
                    options={{
                        overrides: {
                            code: SyntaxHighlightedCode,
                        },
                    }}
                />
            </div>)
    }

    useEffect(() => {

        initializeSocket(project._id)

        if (!webContainer) {
            getWebContainer().then(container => {
                setWebContainer(container)

                // Register server-ready once, when the container is created —
                // not inside the run button, to avoid stacking duplicate listeners
                container.on('server-ready', (port, url) => {
                    console.log("server ready:", port, url)
                    setIframeUrl(url)
                })

                console.log("container started")
            })
        }


        receiveMessage('project-message', data => {

            console.log(data)

            if (data.sender._id == 'ai') {

                const message = JSON.parse(data.message)

                console.log(message)

                if (message.fileTree) {
                    const normalized = normalizeFileTree(message.fileTree)
                    webContainer?.mount(normalized)
                    setFileTree(normalized)
                }

                // Capture whatever build/start commands the AI specified for this
                // project, so the run button doesn't have to guess (e.g. "npm start"
                // vs "npm run dev" for a Vite app).
                if (message.buildCommand) {
                    setBuildCommand(message.buildCommand)
                }
                if (message.startCommand) {
                    setStartCommand(message.startCommand)
                }

                setMessages(prevMessages => [ ...prevMessages, data ]) // Update messages state
            } else {

                setMessages(prevMessages => [ ...prevMessages, data ]) // Update messages state
            }
        })


        axios.get(`/projects/get-project/${location.state.project._id}`).then(res => {

            console.log(res.data.project)

            setProject(res.data.project)
            setFileTree(normalizeFileTree(res.data.project.fileTree || {}))
        })

        axios.get('/users/all').then(res => {

            setUsers(res.data.users)

        }).catch(err => {

            console.log(err)

        })

    }, [])

    function saveFileTree(ft) {
        axios.put('/projects/update-file-tree', {
            projectId: project._id,
            fileTree: ft
        }).then(res => {
            console.log(res.data)
        }).catch(err => {
            console.log(err)
        })
    }


    // Removed appendIncomingMessage and appendOutgoingMessage functions

    function scrollToBottom() {
        messageBox.current.scrollTop = messageBox.current.scrollHeight
    }

    const currentFileValue = getFileFromTree(fileTree, currentFile)

    return (
        <main className='h-screen w-screen flex'>
            <section className="left relative flex flex-col h-screen min-w-96 bg-slate-300">
                <header className='flex justify-between items-center p-2 px-4 w-full bg-slate-100 absolute z-10 top-0'>
                    <button className='flex gap-2' onClick={() => setIsModalOpen(true)}>
                        <i className="ri-add-fill mr-1"></i>
                        <p>Add collaborator</p>
                    </button>
                    <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2'>
                        <i className="ri-group-fill"></i>
                    </button>
                </header>
                <div className="conversation-area pt-14 pb-10 flex-grow flex flex-col h-full relative">

                    <div
                        ref={messageBox}
                        className="message-box p-1 flex-grow flex flex-col gap-1 overflow-auto max-h-full scrollbar-hide">
                        {messages.map((msg, index) => (
                            <div key={index} className={`${msg.sender._id === 'ai' ? 'max-w-80' : 'max-w-52'} ${msg.sender._id == user._id.toString() && 'ml-auto'}  message flex flex-col p-2 bg-slate-50 w-fit rounded-md`}>
                                <small className='opacity-65 text-xs'>{msg.sender.email}</small>
                                <div className='text-sm'>
                                    {msg.sender._id === 'ai' ?
                                        WriteAiMessage(msg.message)
                                        : <p>{msg.message}</p>}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="inputField w-full flex absolute bottom-0">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className='p-2 px-4 border-none outline-none flex-grow' type="text" placeholder='Enter message' />
                        <button
                            onClick={send}
                            className='px-5 bg-slate-950 text-white'><i className="ri-send-plane-fill"></i></button>
                    </div>
                </div>
                <div className={`sidePanel w-full h-full flex flex-col gap-2 bg-slate-50 absolute transition-all ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'} top-0`}>
                    <header className='flex justify-between items-center px-4 p-2 bg-slate-200'>

                        <h1
                            className='font-semibold text-lg'
                        >Collaborators</h1>

                        <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2'>
                            <i className="ri-close-fill"></i>
                        </button>
                    </header>
                    <div className="users flex flex-col gap-2">

                        {project.users && project.users.map(user => {


                            return (
                                <div className="user cursor-pointer hover:bg-slate-200 p-2 flex gap-2 items-center">
                                    <div className='aspect-square rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600'>
                                        <i className="ri-user-fill absolute"></i>
                                    </div>
                                    <h1 className='font-semibold text-lg'>{user.email}</h1>
                                </div>
                            )


                        })}
                    </div>
                </div>
            </section>

            <section className="right  bg-red-50 flex-grow h-full flex">

                <div className="explorer h-full max-w-64 min-w-52 bg-slate-200">
                    <div className="file-tree w-full">
                        {
                            renderFileTree(fileTree, (fullPath) => {
                                setCurrentFile(fullPath)
                                setOpenFiles([ ...new Set([ ...openFiles, fullPath ]) ])
                            })
                        }
                    </div>

                </div>


                <div className="code-editor flex flex-col flex-grow h-full shrink">

                    <div className="top flex justify-between w-full">

                        <div className="files flex">
                            {
                                openFiles.map((file, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentFile(file)}
                                        className={`open-file cursor-pointer p-2 px-4 flex items-center w-fit gap-2 bg-slate-300 ${currentFile === file ? 'bg-slate-400' : ''}`}>
                                        <p
                                            className='font-semibold text-lg'
                                        >{file}</p>
                                    </button>
                                ))
                            }
                        </div>

                        <div className="actions flex gap-2">
                            <button
                                onClick={async () => {
                                    // fileTree is already nested (normalized at the write sites),
                                    // so it's safe to mount directly here
                                    await webContainer.mount(fileTree)

                                    console.log('Running build command:', buildCommand)

                                    const installProcess = await webContainer.spawn(
                                        buildCommand.mainItem,
                                        buildCommand.commands
                                    )

                                    installProcess.output.pipeTo(new WritableStream({
                                        write(chunk) {
                                            console.log(chunk)
                                        }
                                    }))

                                    const installExitCode = await installProcess.exit
                                    if (installExitCode !== 0) {
                                        console.error("Build command failed with exit code", installExitCode)
                                        return
                                    }

                                    if (runProcess) {
                                        runProcess.kill()
                                    }

                                    console.log('Running start command:', startCommand)

                                    let tempRunProcess = await webContainer.spawn(
                                        startCommand.mainItem,
                                        startCommand.commands
                                    );

                                    tempRunProcess.output.pipeTo(new WritableStream({
                                        write(chunk) {
                                            console.log(chunk)
                                        }
                                    }))

                                    setRunProcess(tempRunProcess)

                                    // NOTE: 'server-ready' listener is registered once in the
                                    // useEffect above when the container is created — not here,
                                    // to avoid stacking duplicate listeners on every click.
                                }}
                                className='p-2 px-4 bg-slate-300 text-white'
                            >
                                run
                            </button>


                        </div>
                    </div>
                    <div className="bottom flex flex-grow max-w-full shrink overflow-auto">
                        {
                            currentFileValue && currentFileValue.file && (
                                <div className="code-editor-area h-full overflow-auto flex-grow bg-slate-50">
                                    <pre
                                        className="hljs h-full">
                                        <code
                                            className="hljs h-full outline-none"
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => {
                                                const updatedContent = e.target.innerText;
                                                const ft = setFileInTree(fileTree, currentFile, {
                                                    file: {
                                                        contents: updatedContent
                                                    }
                                                })
                                                setFileTree(ft)
                                                saveFileTree(ft)
                                            }}
                                            dangerouslySetInnerHTML={{
                                                __html: hljs.highlight(
                                                    currentFileValue.file.contents,
                                                    { language: 'javascript' }
                                                ).value
                                            }}
                                            style={{
                                                whiteSpace: 'pre-wrap',
                                                paddingBottom: '25rem',
                                                counterSet: 'line-numbering',
                                            }}
                                        />
                                    </pre>
                                </div>
                            )
                        }
                    </div>

                </div>

                {iframeUrl && webContainer &&
                    (<div className="flex min-w-96 flex-col h-full">
                        <div className="address-bar">
                            <input type="text"
                                onChange={(e) => setIframeUrl(e.target.value)}
                                value={iframeUrl} className="w-full p-2 px-4 bg-slate-200" />
                        </div>
                        <iframe src={iframeUrl} className="w-full h-full"></iframe>
                    </div>)
                }


            </section>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-md w-96 max-w-full relative">
                        <header className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-semibold'>Select User</h2>
                            <button onClick={() => setIsModalOpen(false)} className='p-2'>
                                <i className="ri-close-fill"></i>
                            </button>
                        </header>
                        <div className="users-list flex flex-col gap-2 mb-16 max-h-96 overflow-auto">
                            {users.map(user => (
                                <div key={user.id} className={`user cursor-pointer hover:bg-slate-200 ${Array.from(selectedUserId).indexOf(user._id) != -1 ? 'bg-slate-200' : ""} p-2 flex gap-2 items-center`} onClick={() => handleUserClick(user._id)}>
                                    <div className='aspect-square relative rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600'>
                                        <i className="ri-user-fill absolute"></i>
                                    </div>
                                    <h1 className='font-semibold text-lg'>{user.email}</h1>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addCollaborators}
                            className='absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-md'>
                            Add Collaborators
                        </button>
                    </div>
                </div>
            )}
        </main>
    )
}

export default Project