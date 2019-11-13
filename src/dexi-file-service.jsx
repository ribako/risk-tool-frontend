import service from './service.jsx';

export class DexiFileService {
    uploadFileToServer(data){
        //returns Promise object
        return service.getRestClient().post('/files', data);
    }
    getFileFromServer(id) {

        return service.getRestClient().get('/files/' + id)
    }
}