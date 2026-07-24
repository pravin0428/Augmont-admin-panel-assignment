import { Router } from 'express';
import { authenticate } from '@core/middleware/authenticate';
import { asyncHandler } from '@core/middleware/async-handler';
import { validate } from '@core/middleware/validate';
import { uploadProductImage } from '@modules/upload/upload.middleware';
import { productController } from './product.controller';
import { bulkImportController } from './import/bulk-import.controller';
import { uploadImportFile } from './import/bulk-upload.middleware';
import {
  createProductRules,
  idParamRule,
  listProductRules,
  updateProductRules,
} from './product.validators';

const router = Router();

router.use(authenticate); // all product endpoints require a valid token

// Bulk import — declared before "/:id" so "import" is not captured as an id.
// Multer runs first to parse the multipart file, then the controller streams it.
router.post('/import', uploadImportFile, asyncHandler(bulkImportController.import));

// List with pagination / sorting / search / filtering.
router.get('/', validate(listProductRules), asyncHandler(productController.list));
router.get('/:id', validate(idParamRule), asyncHandler(productController.getOne));

// Create / update accept multipart/form-data (image upload). Multer populates
// req.file and req.body BEFORE validators run against the text fields.
router.post('/', uploadProductImage, validate(createProductRules), asyncHandler(productController.create));
router.put('/:id', uploadProductImage, validate(updateProductRules), asyncHandler(productController.update));

router.delete('/:id', validate(idParamRule), asyncHandler(productController.remove));

export const productRoutes = router;
