import {
	DiagramEngine,
	DiagramModel,
	DefaultNodeModel,
	DiagramWidget,
} from "@projectstorm/react-diagrams";
import * as React from "react";
import './Tool.css';
import axios from "axios";
import { DexiFileService } from './dexi-file-service.jsx';
import {DiagramsFileService} from "./diagrams-file-service";
//import update from 'immutability-helper';

import {
    Button,
    Collapse,
    Card,
    CardBody,
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    Fade,
    Form,
    FormGroup,
    FormText,
    Input,
    ListGroup,
    ListGroupItem,
    InputGroup,
    InputGroupAddon,
    Spinner,
    Alert
} from 'reactstrap';
import {ImageFileService} from "./image-file-service";


require("storm-react-diagrams/dist/style.min.css");


export default class Tool extends React.Component<any, any> {


    constructor(props:any) {
        super(props);
        this.state = {
            devices: []
        };
    }

    render() {

        //1) setup the diagram engine
        var engine = new DiagramEngine();
        engine.installDefaultFactories();

        //2) setup the diagram model
        var model = new DiagramModel();


        //3-A) create a default node
        var node1 = new DefaultNodeModel("IoT Device 1", "rgb(0,192,255)");
        node1.addInPort("In");
        node1.addOutPort("Out");
        node1.setPosition(100, 100);

        //3-B) create another default node
        var node2 = new DefaultNodeModel("IoT Device 2", "rgb(0,192,255)");
        node2.addInPort("In");
        node2.addOutPort("Out");
        node2.setPosition(400, 100);

        //4) add the models to the root graph
        model.addAll(node1, node2);

        //5) load model into engine
        engine.setDiagramModel(model);

        return (
            <div className="all-components">
                <div className="modeling">
                    <Diagram engine={engine} model={model} />
                    <DevicesServices engine={engine} model={model} />
                </div>
                    <DexiModeler />
            </div>
        );
    }
}


class Device extends React.Component<any, any> {
    constructor(props:any) {
        super(props);
        this.toggleCollapse = this.toggleCollapse.bind(this);
        this.edit = this.edit.bind(this);
        this.save = this.save.bind(this);
        this.delete = this.delete.bind(this);
        this.handleDescChange = this.handleDescChange.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);

        this.state= {
            collapse: false,
            editing: false,
            description: "",
            name: this.props.name
        }
    }

    toggleCollapse() {
        this.setState({
            collapse: !this.state.collapse
        });
    }

    edit() {
        this.setState({
            editing: true
        });
    }

    save() {
        this.setState( {
            editing: false
        });
        this.props.handleNodesUpdated();
    }

    delete() {
        const { engine } = this.props.engine;
        let model = engine.getDiagramModel();

        model.removeNode(this.props.id);

        engine.repaintCanvas();
    }

    renderDataNormal() {
        return (
            <div>
                Name: { this.state.name } <br/>
                Description: { this.state.description } <br/>
                <Button color="primary" size="sm" onClick={this.edit}>Edit</Button>{' '}
            </div>
        )
    }

    handleDescChange(event:any) {
        this.setState({
            description: event.target.value
        });
    }


    handleNameChange(event:any) {
        const { engine } = this.props.engine;
        let model = engine.getDiagramModel();
        let node = model.getNode(this.props.id);
        node.name = event.target.value;

        this.setState({
            name: event.target.value
        });

        engine.repaintCanvas();
    }

    renderDataForm() {
        return (
            <div>
                <Form>
                    <FormGroup>
                        Name: <Input type="textarea" name="name" id="deviceName" value ={this.state.name} onChange={ this.handleNameChange }/><br/>
                        Description: <Input type="textarea" name="description" id="descText" value={this.state.description} label="Enter description here" onChange={this.handleDescChange}/><br/>
                        <Button color="primary" size="sm" onClick={this.save}>Save</Button>{' '}
                        <Button color="danger" size="sm" onClick={this.delete}>Delete</Button>{' '}
                    </FormGroup>
                </Form>
            </div>
        )
    }

    renderDeviceData() {
        if (this.state.editing) {
            return this.renderDataForm()
        } else {
            return this.renderDataNormal()
        }
    }

    render() {
        return (
            <div>
                <ListGroupItem tag="button" action draggable={true} onClick={this.toggleCollapse}> { this.props.name } </ListGroupItem>
                <Collapse isOpen={this.state.collapse}>
                    <Card>
                        <CardBody>
                            {this.renderDeviceData()}
                        </CardBody>
                    </Card>
                </Collapse>
            </div>
        )
    }

}

class DevicesServices extends React.Component<any, any> {

    constructor(props:any) {
        super(props);
        this.addItem = this.addItem.bind(this);
        this.renderDevices = this.renderDevices.bind(this);
        this.handleNodesUpdated = this.handleNodesUpdated.bind(this);

        const { model } = this.props;
        model.addListener({ nodesUpdated: this.handleNodesUpdated });
    }

    renderDevices() {
        const { engine } = this.props;
        let model = engine.getDiagramModel();
        const nodes = model.serializeDiagram();
        let listItems = nodes.nodes.map((d:any) =>
            <Device key={d.id} id={d.id} name={d.name} engine={ this.props } handleNodesUpdated={ this.handleNodesUpdated }/>
        );


        return (
            <div>
                <ListGroup>
                    { listItems }
                </ListGroup>

            </div>
        )

    }


    handleNodesUpdated() {
        console.log("Nodes updates, rerender");
        this.forceUpdate();
    }

    addItem() {
        const { engine } = this.props;
        let model = engine.getDiagramModel();

        let nodesCount = Object.keys(model.getNodes()).length;

        let node = new DefaultNodeModel("IoT Device " + (nodesCount + 1), "rgb(0,192,255)");

        node.addInPort("In");
        node.addOutPort("Out");

        node.setPosition(200, 200);

        model.addNode(node);

        engine.setDiagramModel(model);

        engine.repaintCanvas();
        this.forceUpdate();

    }


    render() {
        return(
            <div className = "device-list">
                <Button color="primary" onClick={() => {
                        this.addItem();
                    }}
                >
                    Add device
                </Button>
                {this.renderDevices()}
            </div>
        );
    }
}

class Diagram extends React.Component<any, any> {


    constructor(props: any) {
		super(props);
		this.serializeDiagram = this.serializeDiagram.bind(this);
		this.toggleDeSerialize = this.toggleDeSerialize.bind(this);

		this.state = {
		    deSerializeCollapse: false,
        };
	};


	serializeDiagram() {
		const { engine } = this.props;
		let model = engine.getDiagramModel();

		let today = new Date();
		let filename = "Diagram " + today.getDay() + "-" + (today.getMonth()+1) + " " + today.getHours()+ "-" + today.getMinutes() +  ".json";
        let contentType = "application/json;charset=utf-8;";
        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
            var blob = new Blob([decodeURIComponent(encodeURI(JSON.stringify(model.serializeDiagram())))], { type: contentType });
            navigator.msSaveOrOpenBlob(blob, filename);
        } else {
            var a = document.createElement('a');
            a.download = filename;
            a.href = 'data:' + contentType + ',' + encodeURIComponent(JSON.stringify(model.serializeDiagram()));
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
	}


	toggleDeSerialize() {
        this.setState({deSerializeCollapse: !this.state.deSerializeCollapse})
    }
    
    handleFileUpload(e:any) {
        let fileService = new DiagramsFileService();
        const data = new FormData();
        //using File API to get chosen file
        console.log("Uploading file", e.target.files[0]);
        data.append('file', e.target.files[0]);
        let fileName = e.target.files[0].name;


        //calling async Promise and handling response or error situation
        fileService.uploadFileToServer(data).then((response: any) => {
             axios.get('https://risktool-586bf.appspot.com/diagrams/' + fileName)
            .then(response => {

                let { engine } = this.props;
                let model2 = new DiagramModel();

                model2.deSerializeDiagram(response.data, engine);
                engine.setDiagramModel(model2);
                engine.repaintCanvas();
                this.forceUpdate();
                });
             this.toggleDeSerialize()
        }).catch(function (error: any) {
            console.log(error);
            if (error.response) {
                //HTTP error happened
                console.log("Upload error. HTTP errorcode =", error.response.status);
            } else {
                //some other error happened
                console.log("Upload error =", error.message);
            }
        });

    }


    render() {
        const { engine } = this.props;


        return (
            <div className="tool">
                <Button color="primary"
                    onClick={() => {
                        this.serializeDiagram()
                    }}
                >
                    Serialize Graph
                </Button>
                <Button color="primary" onClick={this.toggleDeSerialize}>
                    DeSerialize Graph
                </Button>
                <Collapse isOpen={this.state.deSerializeCollapse}>
                    <Form>
                        <FormGroup>
                            <Input type="file" name="file" id="exampleFile" accept=".json"
                                   onChange={e => {
                                       this.handleFileUpload(e)
                                   }}
                                   onClick={e => {
                                        var elem = e.target as HTMLInputElement;
                                        elem.value = ''
                                    }}
                            />
                            <FormText color="muted">
                                The diagram tool only accepts JSON files
                            </FormText>
                        </FormGroup>
                    </Form>
                </Collapse>


                <div className="canvas"
                  onDrop={event => {
                      //var data = JSON.parse(event.dataTransfer.getData("storm-diagram-node"));
                      //console.log(data);
                      //console.log(event);
                      //TODO console.log(event.dataTransfer); add support for drag-and-drop
                  }}
                  onDragOver={event => {
						event.preventDefault();
				  }}
                >
                    <DiagramWidget className="srd-demo-canvas" diagramEngine={engine}/>
                </div>
            </div>
        );
    }
}

class DexiModeler extends React.Component<any, any> {

    constructor(props: any) {
        super(props);
        this.delete = this.delete.bind(this);
        this.renderDexiList = this.renderDexiList.bind(this);
        this.setActive = this.setActive.bind(this);
        this.downloadActiveDexi = this.downloadActiveDexi.bind(this);
        this.mergeFiles = this.mergeFiles.bind(this);

        this.state = {
            dexiList: [],
            activeItem: [],
            dexiData: [],
            corasData: [],
        }

    }

    delete(id:any) {
        this.setState({dexiList: this.state.dexiList.filter(function(item:any) {
            return item.id !== id;
            }),
            dexiData: this.state.dexiData.filter(function (item:any) {
                return item.id !== id;
            }),
            corasData: this.state.corasData.filter(function (item:any) {
                return item.id !== id;
            })
        });
    }

    readDexi(response:any, id:any) {
        console.log(response);

        let regex  = RegExp('([^=;]*)=([^;]*)','g');

        let res;
        let attList = [];
        let inputList = [];

        while((res = regex.exec(response.data)) !== null) {
            console.log(res[1] + res[2]);
            attList.push(res[1]);
            inputList.push(res[2]);
        }

        this.setState({
            dexiData: [...this.state.dexiData,
                {
                    id: id,
                    data: response.data,
                    attList: attList,
                    inputList: inputList,
                }],
            activeItem: id
        });
    }

    setActive(id:any) {
        //console.log(this.state.dexiData.filter((item:any) => (item.id === id)));
        if (this.state.dexiData.filter((item:any) => (item.id === id)).length != 0) {
            console.log("Found");
            this.setState({activeItem:id})
        } else {
            axios.get('https://risktool-586bf.appspot.com/files/' + id)
                .then(response => {
                    this.readDexi(response, id)
                });
            axios.get('https://risktool-586bf.appspot.com/images/' + id, {responseType: 'arraybuffer'})
                .then(response => {
                    const base64 = btoa(
                        new Uint8Array(response.data).reduce(
                            (data, byte) => data + String.fromCharCode(byte),
                            '',
                        )
                    );
                    this.setState({
                        corasData: [...this.state.corasData,
                            {
                                id: id,
                                data: "data:;base64," + base64
                            }]
                    });
                    console.log(id);
                });
        }

    }

    downloadActiveDexi() {
        console.log(this.state.aciveItem);
        axios.get('https://risktool-586bf.appspot.com/' + this.state.activeItem) //TODO
            .then(response => {
                console.log(response);
            })

    }


    mergeFiles(dexiFile: File, corasFile: File) {
        let dexiFileService = new DexiFileService();
        let imageFileService = new ImageFileService();
        const dexiData = new FormData();
        const imageData = new FormData();
        //using File API to get chosen file

        dexiData.append('file', dexiFile);
        imageData.append('file', corasFile);
        imageData.append('name', dexiFile.name);

        if (this.state.dexiList.find(function (item: any) {
            return item.name === dexiFile.name;
        }) !== undefined) {
            console.log("Duplicate found"); //todo better error handling
        } else {
            console.log("Uploading files");
            //calling async Promise and handling response or error situation
            dexiFileService.uploadFileToServer(dexiData).then((response: any) => {
                this.setState({
                    dexiList: [...this.state.dexiList,
                        {
                            id: dexiFile.name,
                            name: dexiFile.name
                        }
                    ]
                });
            }).catch(function (error: any) {
                console.log(error);
                if (error.response) {
                    //HTTP error happened
                    console.log("Dexi Upload error. HTTP errorcode =", error.response.status);
                } else {
                    //some other error happened
                    console.log("Dexi Upload error =", error.message);
                }
            });

            //calling async Promise and handling response or error situation
            imageFileService.uploadFileToServer(imageData).then((response: any) => {
            }).catch(function (error: any) {
                console.log(error);
                if (error.response) {
                    //HTTP error happened
                    console.log("Coras Upload error. HTTP errorcode =", error.response.status);
                } else {
                    //some other error happened
                    console.log("Coras Upload error =", error.message);
                }
            });
        }
    }

    renderDexiList() {
        let listItems = this.state.dexiList.map((d:any) => {
            let className = this.state.activeItem === d.id ? d.id + " active" : d.id;
                return ( <DexiModel cName={className} key={d.id} id = {d.id} name={d.name} delete={this.delete} setActive={this.setActive} />
            );
        });

        return (
            <div>
                <ListGroup>
                    { listItems }
                </ListGroup>
            </div>
        )

    }


    render() {
        return (
            <div className="dexi-modeler">
                <DexiVisual activeItem={this.state.activeItem} dexiData={this.state.dexiData} corasData={this.state.corasData}/>
                <DexiList renderDexiList={this.renderDexiList} mergeFiles={this.mergeFiles} downloadActiveDexi={this.downloadActiveDexi}/>
            </div>
        )
    };

}

class DexiVisual extends React.Component<any, any> {

    constructor(props: any) {
        super(props);
        this.toggleDropdown = this.toggleDropdown.bind(this);
        this.simulateRealTime = this.simulateRealTime.bind(this);
        this.toggleRealtime = this.toggleRealtime.bind(this);
        this.toggleAlert = this.toggleAlert.bind(this);
        this.calculateRisk = this.calculateRisk.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.componentDidUpdate = this.componentDidUpdate.bind(this);
        this.alert = this.alert.bind(this);


        this.state = {
            image: undefined,
            dropdownOpen: [],
            dropdownSelected: [],
            active: [],
            alert: false,
            alertText: "",
            fadeIn:false,
            risk: undefined,
            realTime: false,
            timeOut: undefined,
        }
    }

    toggleDropdown(index:any) {
        this.setState({dropdownOpen: {...this.state.dropdownOpen, [index]: !this.state.dropdownOpen[index]}})
    }

    toggleAlert() {
        this.setState({alert: !this.state.alert});
    }

    alert(text:String) {
        this.setState({alert: true, alertText: text})
    }

    handleClick(e:any, d:any, option:any) {
        this.setState({dropdownSelected: {...this.state.dropdownSelected, [d]: option}})
    }

    toggleRealtime() {
        if(this.state.realTime == false) {
            this.setState({realTime: true});
            this.simulateRealTime()
        } else {
            this.setState({realTime: false});
            console.log("Stopping simulation");
            clearTimeout(this.state.timeOut);
        }

    }

    simulateRealTime() {
        console.log("Running simulation...");
        let active = this.props.dexiData.filter((item: any) => (item.id === this.props.activeItem))[0];

        let data = {};
        let itemsProcessed = 0;
        let localDropdownSelected: any[] = [];

        active.attList.forEach((e:any, index:any, arr:any) => {

            let inputs = active.inputList[index].split(",");
            let randInput = Math.floor(Math.random()*inputs.length);

            data[e]=inputs[randInput];
            localDropdownSelected[e] = inputs[randInput];

            itemsProcessed++;
            if(itemsProcessed === arr.length) {
                this.setState({dropdownSelected: localDropdownSelected});
                this.sendAttributesToServerAndCalcRisk(data, active)
            }
        });



        let rand = Math.round(Math.random()*(4000-1000))+1500; // generate new time (between 4.5 sec and 1.5sec)
        console.log(rand);

        let timeOut = setTimeout(() => this.simulateRealTime(), rand);
        this.setState({timeOut: timeOut});


    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any): void {
        if (this.state.dropdownSelected != prevState.dropdownSelected && !this.state.realTime) {
            this.calculateRisk(false);
        }
    }


    componentWillUnmount(): void {
        clearTimeout(this.state.timeOut);
    }

    calculateRisk(alert:boolean) {
        let active = this.props.dexiData.filter((item: any) => (item.id === this.props.activeItem))[0];
        let noNulls = true;
        let itemsProcessed = 0;

        let data = {};

        active.attList.forEach((e:any, inx:any, arr:any) => {
            if (this.state.dropdownSelected[e] == undefined) {
                if (alert) {
                    this.alert("Please insert a value for each input")
                }
                noNulls = false;
            } else {
                data[e]=this.state.dropdownSelected[e];
            }
            itemsProcessed++;
            if(itemsProcessed === arr.length && noNulls) {
                this.sendAttributesToServerAndCalcRisk(data, active)
            }
        });

    }

    sendAttributesToServerAndCalcRisk(attributes:object, active:any) {
        console.log("Sending to server");
        //console.log(active);
        axios.post('https://risktool-586bf.appspot.com/calculate/' + active.id, attributes)
        .then(response => {
            console.log(response);
            this.setState({risk:response.data, fadeIn: true});
        }).catch(error => {
            if(error.response) {
                console.log(error.response.data);
                this.alert(error.response.data)
            } else {
                console.log(error);
                this.alert(error)
            }
            this.setState({realTime: false});
            clearTimeout(this.state.timeOut);
        })
    }



    renderDexiData() {
        let imageToRender = [];
        let active;

        if(this.props.dexiData.filter((item: any) => (item.id === this.props.activeItem))[0] !== undefined ) {
            active = this.props.dexiData.filter((item: any) => (item.id === this.props.activeItem))[0];
        }

        if(this.props.corasData.filter((item: any) => (item.id === this.props.activeItem))[0] !== undefined ) {
            imageToRender = this.props.corasData.filter((item: any) => (item.id === this.props.activeItem))[0].data;
        }

        let attributes:any;
        let inputs:any;
        let dataToRender;
        let dropdownSeelected:any = [];
        if (active != undefined) {
             attributes = active.attList;
             inputs = active.inputList;

             dataToRender = attributes.map((d:any, index:any) => {
                 dropdownSeelected[d] = "Null";
                 return (
                     <div key={d} className="dropdown-box">
                        <Dropdown key={ d} isOpen={this.state.dropdownOpen[index]}
                               toggle={() => this.toggleDropdown(index)}>
                            <DropdownToggle caret>
                                {d}
                            </DropdownToggle>
                            <DropdownMenu>
                                {inputs[index].split(",").map((option:any) => <DropdownItem key={option} onClick={(e:any) => this.handleClick(e, d, option)} >{option}</DropdownItem>)}
                            </DropdownMenu>
                        </Dropdown>
                         {this.state.dropdownSelected[d] === undefined ? "Null" : this.state.dropdownSelected[d]}
                     </div>
                 )
             });
        }


        return (
            <div>
                    <img src={imageToRender}/>
                    <div className="dropdowns">
                        {dataToRender}
                    </div>
            </div>
        )
    }

    render() {
        return (
            <div className="dexi-visual">
                {this.props.activeItem}
                {this.renderDexiData()}
                <Alert color="danger" isOpen={this.state.alert} toggle={this.toggleAlert}>{this.state.alertText}</Alert>
                <Button color="info" hidden={!this.props.dexiData.filter((item: any) => (item.id === this.props.activeItem))[0]} onClick={this.toggleRealtime}>{!this.state.realTime ? "Simulate real-time inputs" : "Simulating..."}</Button>
                <Spinner color="info" hidden={!this.state.realTime}/>
                <Button color="info" hidden={!this.props.dexiData.filter((item: any) => (item.id === this.props.activeItem))[0]} onClick={() => this.calculateRisk(true)}>CalculateRisk</Button>
                <Fade in={this.state.fadeIn} tag="h5" className="risk">The overall risk is: {this.state.risk}</Fade>
            </div>
        )
    }
}

class DexiList extends React.Component<any, any> {

    constructor(props: any) {
        super(props);
        this.toggleUploadCollapse = this.toggleUploadCollapse.bind(this);
        this.dexiUpload = this.dexiUpload.bind(this);
        this.mergeDexiAndCoras = this.mergeDexiAndCoras.bind(this);
        this.dexiUpload = this.dexiUpload.bind(this);
        this.corasUpload = this.corasUpload.bind(this);
        this.dexiDismiss = this.dexiDismiss.bind(this);
        this.corasDismiss = this.corasDismiss.bind(this);

        this.state = {
            uploadCollapse: false,
            dexiFile: {},
            corasFile: {},
            dexiAlert: false,
            corasAlert: false,
        }
    }

    toggleUploadCollapse() {
        this.setState({uploadCollapse: !this.state.uploadCollapse})
    }

    clickDexi() {
        document.getElementById('hidden-dexi-input')!.click();
    }

    clickCoras() {
        document.getElementById('hidden-coras-input')!.click();
    }

    dexiUpload(e:any) {
        this.setState({dexiFile: e.target.files[0]})
    }

    corasUpload(e:any) {
        this.setState({corasFile: e.target.files[0]})
    }

    mergeDexiAndCoras() {
        //TODO Shady if checks
        if (typeof(this.state.dexiFile.name) != "string") {
            this.setState({dexiAlert: true})
        } else if (typeof(this.state.corasFile.name) != "string") {
            this.setState({corasAlert: true})
        } else {
            console.log('Merging files');
            this.toggleUploadCollapse();
            this.props.mergeFiles(this.state.dexiFile, this.state.corasFile);
            this.setState({corasAlert: false, dexiAlert: false});
        }
    }

    dexiDismiss() {
        this.setState({dexiAlert: false});
    }

    corasDismiss() {
        this.setState({corasAlert: false});
    }

    render() {
        return (
            <div className="dexi-list">
                <Button color="primary" onClick={this.toggleUploadCollapse}>
                    Add Coras and DEXi
                </Button>
                <Button onClick={this.props.downloadActiveDexi}>Donwload</Button>
                 <Collapse isOpen={this.state.uploadCollapse}>
                     <InputGroup>
                         <div id="dexi-input">
                            <InputGroupAddon addonType="prepend"><Button onClick={this.clickDexi}>DEXi</Button></InputGroupAddon>
                             <Input disabled placeholder={this.state.dexiFile.name}/>
                             <Alert color="danger" isOpen={this.state.dexiAlert} toggle={this.dexiDismiss}>Missing DEXi file!</Alert>
                         </div>
                         <div id="coras-input">
                             <InputGroupAddon addonType="prepend"><Button onClick={this.clickCoras}>Coras</Button></InputGroupAddon>
                             <Input disabled placeholder={this.state.corasFile.name}/>
                             <Alert color="danger" isOpen={this.state.corasAlert} toggle={this.corasDismiss}>Missing coras file!</Alert>
                         </div>

                         <input id="hidden-dexi-input" hidden type="file" accept=".dxi"
                           onChange={e => {
                               this.dexiUpload(e);
                           }}
                           onClick={e => {
                               var elem = e.target as HTMLInputElement;
                               elem.value = ''
                           }}
                         />
                         <input id="hidden-coras-input" hidden type="file" accept="image/png"
                           onChange={e => {
                               this.corasUpload(e);
                           }}
                           onClick={e => {
                               var elem = e.target as HTMLInputElement;
                               elem.value = ''
                           }}
                         />
                     </InputGroup>
                     <Button color="primary" onClick={this.mergeDexiAndCoras}>Merge and Upload</Button>
                 </Collapse>
                {this.props.renderDexiList()}
            </div>
        )
    };
}

class DexiModel extends React.Component<any, any> {

    constructor(props: any) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
        this.edit = this.edit.bind(this);
        this.save = this.save.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.delete = this.delete.bind(this);

        this.state = {
            id: this.props.id,
            collapse: false,
            editing: false,
            description: ""
        }
    }

    handleClick() {
        this.props.setActive(this.state.id);
    }

    toggleCollapse() {
        this.setState({collapse: !this.state.collapse});
    }

    edit() {
        this.setState({
            editing: true
        })
    }

    save() {
        this.setState({
            editing: false
        })
    }

    delete() {
        this.props.delete(this.state.id)
    }

    renderDataNormal() {
        return (
            <div>
                ID: {this.state.id} <br/>
                Description: {this.state.description} <br/>
                <Button color="primary" size="sm" onClick={this.edit}>Edit</Button>{' '}
                <Button color="danger" size="sm" onClick={this.delete}>Delete Model</Button>{' '}
            </div>
        )
    }

    handleChange(event: any) {
        this.setState({
            description: event.target.value
        });
    }

    renderDataForm() {
        return (
            <div>
                ID: {this.state.id} <br/>
                <Form>
                    <FormGroup>
                        Description: <Input type="textarea" name="description" id="descText"
                                            value={this.state.description} label="Enter description here"
                                            onChange={this.handleChange}/><br/>
                        <Button color="primary" size="sm" onClick={this.save}>Save</Button>{' '}
                    </FormGroup>
                </Form>
            </div>
        )
    }

    renderDexiData() {
        if (this.state.editing) {
            return this.renderDataForm()
        } else {
            return this.renderDataNormal()
        }
    }

    render() {
        return (
            <div>
                <ListGroupItem className={this.props.cName} tag="div"
                               onClick={this.handleClick}>{this.props.name}
                    <Button outline color={"success"} size={"sm"} onClick={(e: any) => {
                        e.stopPropagation();
                        this.toggleCollapse()
                    }}>
                        Edit</Button>
                </ListGroupItem>
                <Collapse isOpen={this.state.collapse}>
                    <Card>
                        <CardBody>
                            {this.renderDexiData()}
                        </CardBody>
                    </Card>
                </Collapse>
            </div>
        )
    }
}