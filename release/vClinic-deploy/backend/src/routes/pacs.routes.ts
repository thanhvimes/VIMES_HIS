import { Router } from 'express';
import { PacsController } from '../controllers/pacs/pacs.controller';

const router = Router();

router.post('/imaging/results', PacsController.saveImagingResult);
router.get('/imaging/worklist', PacsController.getImagingWorklist);
router.get('/imaging/templates/custom', PacsController.getCustomTemplates);
router.post('/imaging/templates/custom', PacsController.saveCustomTemplate);
router.delete('/imaging/templates/custom/:id', PacsController.deleteCustomTemplate);

router.get('/imaging/favorites/:doctorId', PacsController.getFavorites);
router.post('/imaging/favorites', PacsController.addFavorite);
router.delete('/imaging/favorites/:doctorId/:orderId/:itemId', PacsController.removeFavorite);

router.post('/imaging/upload', PacsController.uploadPacsFile);

router.get('/records/:recordId/imaging-results', PacsController.getRecordImagingResults);
router.get('/records/:recordId/images', PacsController.getRecordImages);
router.get('/his/record/:recordId/imaging', PacsController.getRecordImagingResults);
router.get('/his/record/:recordId/images', PacsController.getRecordImages);

export default router;
