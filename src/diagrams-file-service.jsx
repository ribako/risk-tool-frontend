import service from './service.jsx';

export class DiagramsFileService {
    uploadFileToServer(data){
        //returns Promise object
        return service.getRestClient().post('/diagrams', data);
    }
}