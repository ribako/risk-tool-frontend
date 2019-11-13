import service from './service.jsx';

export class ImageFileService {
    uploadFileToServer(data){
        //returns Promise object
        return service.getRestClient().post('/images', data);
    }
}