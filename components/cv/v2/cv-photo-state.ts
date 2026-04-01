export {
  DEFAULT_PHOTO_CROP_PRESENTATION as DEFAULT_CV_PHOTO_PRESENTATION,
  createPhotoCropState as createCvEditedPhotoState,
  getPhotoCropImageStyle as getCvPhotoImageStyle,
  getPhotoCropObjectPosition as getCvPhotoObjectPosition,
  normalizePhotoCropPresentation as normalizeCvPhotoPresentation
} from "@/components/shared/photo/photo-crop-state";

export type {
  PhotoCropPresentation as CvPhotoPresentation,
  PhotoCropState as CvEditedPhotoState
} from "@/components/shared/photo/photo-crop-state";
