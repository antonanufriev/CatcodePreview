package com.reactlibrary;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;

import android.graphics.Bitmap;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.opencv.core.Core;
import org.opencv.core.Mat;
import org.opencv.core.Rect;
import org.opencv.imgproc.Imgproc;

import org.opencv.android.Utils;
import org.opencv.core.Size;

import android.graphics.Matrix;
import android.graphics.RectF;
import android.net.Uri;
import android.provider.MediaStore;
import android.util.Log;
import android.widget.Toast;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import com.tflite.Classifier;
import com.tflite.TFLiteObjectDetectionAPIModel;

import com.tflite.NeuralCodeGenerator;

public class RNLibraryModule extends ReactContextBaseJavaModule {

    private Classifier detector; //Object Detector
    private NeuralCodeGenerator generator; //Neural Code Generator

    //Object Detection configuration variables:
    private static final float MINIMUM_CONFIDENCE_TF_OD_API = 0.8f; // Minimum detection confidence to track a detection.
    private static final int TF_OD_API_INPUT_SIZE = 300; //input size of object detector (pixel)
    private static final boolean TF_OD_API_IS_QUANTIZED = true;
    private static final String TF_OD_API_MODEL_FILE = "models/detect.tflite";
    private static final String TF_OD_API_LABELS_FILE = "file:///android_asset/models/labelmap.txt";

    //Neural Code Generator configuration variables:
    private static final int TF_GENERATOR_INPUT_SIZE = 100;
    private static final String NCG_MODEL_FILE = "models/105500_float_quant_model.tflite";
    //private static final String NCG_MODEL_FILE = "models/105500_float16_quant_model.tflite";
    //private static final double DISTANCE_THRESHOLD = 220.0; //for 159000 17augustBis
    private static final double DISTANCE_THRESHOLD = 280.0; //for 105500 18august

    private final ReactApplicationContext reactContext;

    //Stores temporarily neural code of the new catcode found, before save to SQLite
    private float[] newNeuralCode;

    public RNLibraryModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        MatchingDatabaseAdapter.init(reactContext);

        //Initialize Object Detector
        try {
            detector = TFLiteObjectDetectionAPIModel.create(
                    reactContext.getAssets(),
                    TF_OD_API_MODEL_FILE,
                    TF_OD_API_LABELS_FILE,
                    TF_OD_API_INPUT_SIZE,
                    TF_OD_API_IS_QUANTIZED);
        } catch (final IOException e) {
            e.printStackTrace();
            Log.i("f-C", "Exception initializing detector!");
            Toast toast = Toast.makeText(reactContext, "Classifier could not be initialized", Toast.LENGTH_SHORT);
            toast.show();
        }

        //Initialize Neural Code Generator
        try {
            generator = new NeuralCodeGenerator(this.getReactApplicationContext(), NCG_MODEL_FILE);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Override
    public String getName() {
        return "RNLibrary";
    }

    /*
        detectCatcode
        -------------
        Find a catcode in an image (provided with a string Uri, and return the catcode info).
    */
    @ReactMethod
    public void detectCatcode(String uri, Integer deviceOrientation, Callback errorCallback, Callback successCallback) {

        //long tStart = System.currentTimeMillis();

        //Allow only portrait mode:
        if (deviceOrientation == 1) {

            //Detection State vars:
            boolean catcodeFound = false; //true if a catcode has been found
            boolean catcodeRotated = false; //true if a catcode must be rotated

            try {
                //Get bitmap from uri
                Bitmap cameraImage = MediaStore.Images.Media.getBitmap(reactContext.getContentResolver(), Uri.parse(uri));

                /*
                long tEnd1 = System.currentTimeMillis();
                long tDelta1 = tEnd1 - tStart;
                Log.i("f-C", "t1: " + tDelta1);
                */

                //Get original w, h
                int width = cameraImage.getWidth();
                int height = cameraImage.getHeight();

                //Check if we should rotate the image
                //Rotate if orientation is portrait (1) and w > h
                if (width > height) {
                    catcodeRotated = true;
                }

                //Create a copy with ARGB_8888 for bitmapToMat func
                Bitmap cameraImageCopy = cameraImage.copy(Bitmap.Config.ARGB_8888, true);

                //Resize image
                Bitmap cameraImageResized = getResizedBitmap(cameraImage, TF_OD_API_INPUT_SIZE, TF_OD_API_INPUT_SIZE);

                //Rotate the image if needed
                if (catcodeRotated) {
                    Matrix matrix = new Matrix();
                    matrix.postRotate(90);
                    cameraImageResized = Bitmap.createBitmap(cameraImageResized, 0, 0, TF_OD_API_INPUT_SIZE, TF_OD_API_INPUT_SIZE, matrix, true);
                }

                //Compute tflite object detector
                final List<Classifier.Recognition> results = detector.recognizeImage(cameraImageResized);

                //For each detector result
                for (final Classifier.Recognition result : results) {
                    //Log.i("f-C", result.toString());

                    if (validateCatcode(result)){
                        //Convert Bitmap to Mat
                        Mat cameraImageMat = new Mat();
                        Utils.bitmapToMat(cameraImageCopy, cameraImageMat); //TODO AVOID use cameraImageCopy to speed up

                        Rect cropRect;

                        //Compute the cropRect
                        if (catcodeRotated) {
                            //Rotate the cropRect if needed
                            cropRect = rotatedRect(result.getLocation(), width, height);
                        } else {
                            int x = Math.round(result.getLocation().left) * width / TF_OD_API_INPUT_SIZE;
                            int y = Math.round(result.getLocation().top) * height / TF_OD_API_INPUT_SIZE;
                            int w = Math.round(result.getLocation().width()) * width / TF_OD_API_INPUT_SIZE;
                            int h = Math.round(result.getLocation().height()) * height / TF_OD_API_INPUT_SIZE;
                            cropRect = new Rect(x, y, w, h);
                        }

                        //Crop: crop the original image with cropRect
                        Mat crop = cameraImageMat.submat(cropRect);

                        //Rotate the crop if needed
                        if (catcodeRotated) {
                            Core.rotate(crop, crop, Core.ROTATE_90_CLOCKWISE);
                        }

                        //Preprocess the crop
                        crop = preprocess(crop);

                        //Compute neural code A
                        ByteBuffer cropByte = MyUtils.convertMattoTfLiteInput(crop);
                        float[] ncodeA = generator.predictProbabilities(cropByte)[0];

                        catcodeFound = true;

                        //Get all catcodes from db
                        ArrayList<Features> allFeatures = MatchingDatabaseAdapter.getAllItems(null);
                        String catcodeFoundId = null;

                        //Initialize an array containing distances
                        float[] distances = new float[allFeatures.size()];

                        //Loop all the catcodes
                        for (int i = 0; i < allFeatures.size(); i++) {

                            //Get catcode neural code B
                            float[] ncodeB = allFeatures.get(i).neuralcode;

                            //Calculate distance
                            float distance = distance(ncodeA, ncodeB);
                            //Log.i("f-C", "Distance: " + distance);

                            //Add distance to array
                            distances[i] = distance;
                        }

                        if(distances.length>0) {
                            //Find the index of the minimum value
                            int minIndex = findMinimum(distances);

                            //Check threshold
                            if (distances[minIndex] < DISTANCE_THRESHOLD) { //Catcode found!
                                catcodeFoundId = allFeatures.get(minIndex).ID;
                            }
                        }

                        //MatchingDatabaseAdapter.close();
                        if (catcodeFoundId == null) {//Catcode is new
                            newNeuralCode = ncodeA;
                            successCallback.invoke(null, allFeatures.size());
                        } else {//Catcode is old
                            successCallback.invoke(catcodeFoundId, allFeatures.size());
                        }

                        break;
                    }
                }

                if (!catcodeFound) {
                    Toast toast = Toast.makeText(reactContext, "Catcode not found", Toast.LENGTH_SHORT);
                    toast.show();
                    errorCallback.invoke(1); //Catcode is not found (error code:1)
                }

            } catch (final IOException e) {
                Toast toast = Toast.makeText(reactContext, "Catcode unknown error", Toast.LENGTH_SHORT);
                toast.show();
                errorCallback.invoke(0); //Catcode generic error (error code:0)
            }
        } else {
            Toast toast = Toast.makeText(reactContext, "Fix orientation. Use portrait mode.", Toast.LENGTH_SHORT);
            toast.show();
            errorCallback.invoke(2); //Catcode generic error (error code:2)
        }
    }

    /*
        getCatcodeList
        -------------
        Get the list of all the catcode stored.
    */
    @ReactMethod
    public void getCatcodeList(Callback errorCallback, Callback successCallback) {

        //Select colums to get
        String[] columns = new String[]{
                DatabaseHelper.ID_FIELD_NAME,
                DatabaseHelper.IMG_NAME_FIELD_NAME,
                DatabaseHelper.TIMESTAMP_FIELD_NAME
        };

        //Get all items
        ArrayList<Features> allFeatures = MatchingDatabaseAdapter.getAllItems(columns);

        //Create a JSON array
        JSONArray catcodes = new JSONArray();
        for (int i = 0; i < allFeatures.size(); i++) {
            catcodes.put(getCatcodeObj(allFeatures.get(i).ID, allFeatures.get(i).name, new SimpleDateFormat("MMMM dd, yyyy").format(allFeatures.get(i).timestamp)));
        }

        //Return
        successCallback.invoke(catcodes.toString());

    }

    /*
        newCatcode
        -------------
        Save a new Catcode in db
    */
    @ReactMethod
    public void newCatcode(String name, String attachments, Callback errorCallback, Callback successCallback) {

        MatchingDatabaseAdapter.addItem(name, newNeuralCode, attachments, reactContext);

        //Save file to SD
        try {
            //Create Json array from attachments string
            JSONObject o = new JSONObject(attachments);

            //Get type
            String type = o.getString("type");

            //if is a Media type
            if (type.equals("image")) {
                String attachmentId = o.getString("id");
                String stringUri = o.getString("uri");

                //Get the extension from the uri
                String extension = o.getString("extension"); //example: "jpg"

                Uri uri = Uri.parse(stringUri);

                //Create the destination path (external SD)
                String destination = reactContext.getExternalFilesDir(null).getAbsolutePath() + File.separatorChar + attachmentId + "." + extension;

                //Save
                savefile(uri, destination);
            } else if ((type.equals("video")) || (type.equals("audio"))) {

                /* For audio and video
                   Extension is not extracted from file uri, because sometimes uri does't have it.
                   We compute the extensions in React and pass here
                */
                String attachmentId = o.getString("id");
                String stringUri = o.getString("uri");
                String extension = o.getString("extension"); //example: "mp4" (no dot)
                Uri uri = Uri.parse(stringUri);

                //Create the destination path (external SD)
                String destination = reactContext.getExternalFilesDir(null).getAbsolutePath() + File.separatorChar + attachmentId + "." + extension;

                //Save
                savefile(uri, destination);
            } else if (type.equals("pdf")) {
                String attachmentId = o.getString("id");
                String stringUri = o.getString("uri");
                Uri uri = Uri.parse(stringUri);

                //Create the destination path (external SD)
                String destination = reactContext.getExternalFilesDir(null).getAbsolutePath() + File.separatorChar + attachmentId + ".pdf";

                //Save
                savefile(uri, destination);
            }


        } catch (JSONException err) {
            Log.d("Error", err.toString());
        }

        successCallback.invoke(true);
        //TODO return false, if error
    }

    /*
        getCatcode
        -------------
        Get a Catcode by id
    */
    @ReactMethod
    public void getCatcode(String id, Callback errorCallback, Callback successCallback) {

        Features catcode = MatchingDatabaseAdapter.getItem(id);

        //Return
        successCallback.invoke(catcode.name, new SimpleDateFormat("MMMM dd, yyyy").format(catcode.timestamp), catcode.attachments.toString());

    }

    /*
        updateCatcode
        -------------
        Update a Catcode by id
    */
    @ReactMethod
    public void updateCatcode(String id, String name, String attachments, Callback errorCallback, Callback successCallback) {

        MatchingDatabaseAdapter.updateItem(id, name, attachments);

        //Save file to SD
        try {
            //Create Json array from attachments string
            JSONObject o = new JSONObject(attachments);

            //Get type
            String type = o.getString("type");

            //if is a Media type
            if (type.equals("image")) {

                String attachmentId = o.getString("id");
                String stringUri = o.getString("uri");

                //String extension = stringUri.substring(stringUri.lastIndexOf(".")); //example ".jpg"
                String extension = o.getString("extension"); //example: "jpg"

                //Create the destination path (external SD)
                String destination = reactContext.getExternalFilesDir(null).getAbsolutePath() + File.separatorChar + attachmentId + extension;

                //Check if the file already exist
                File file = new File(destination);
                if (!file.exists()) {
                    //If NOT exist, save it
                    Uri uri = Uri.parse(stringUri);
                    savefile(uri, destination);
                }

            } else if ((type.equals("video")) || (type.equals("audio"))) {

                String attachmentId = o.getString("id");
                String stringUri = o.getString("uri");

                String extension = o.getString("extension");
                ; //example ".mp4"

                //Create the destination path (external SD)
                String destination = reactContext.getExternalFilesDir(null).getAbsolutePath() + File.separatorChar + attachmentId + "." + extension;

                //Check if the file already exist
                File file = new File(destination);
                if (!file.exists()) {
                    //If NOT exist, save it
                    Uri uri = Uri.parse(stringUri);
                    savefile(uri, destination);
                }

            } else if (type.equals("pdf")) {
                String attachmentId = o.getString("id");
                String stringUri = o.getString("uri");
                Uri uri = Uri.parse(stringUri);

                //Log.i("f-C", "uri is: "+ uri.toString());

                //Create the destination path (external SD)
                String destination = reactContext.getExternalFilesDir(null).getAbsolutePath() + File.separatorChar + attachmentId + ".pdf";

                //Save
                savefile(uri, destination);
            }


        } catch (JSONException err) {
            Log.d("Error", err.toString());
        }

        //Return
        successCallback.invoke(true);

    }

    /*
        deleteCatcode
        -------------
        Detele a Catcode by id
    */
    @ReactMethod
    public void deleteCatcode(String id, Callback errorCallback, Callback successCallback) {

        //First delete all media
        deletemedia(id);

        //Then Delete catcode from db
        MatchingDatabaseAdapter.deleteItem(id);

        //Return
        successCallback.invoke(true);

    }

    /*
        deleteAllCatcode
        -------------
        Delete all catcodes
    */
    @ReactMethod
    public void deleteAllCatcode(Callback errorCallback, Callback successCallback) {

        //First delete all media from every catcode:
        //Select colums to get
        String[] columns = new String[]{
                DatabaseHelper.ID_FIELD_NAME,
                DatabaseHelper.IMG_NAME_FIELD_NAME,
                DatabaseHelper.TIMESTAMP_FIELD_NAME
        };

        //Get all items
        ArrayList<Features> allFeatures = MatchingDatabaseAdapter.getAllItems(columns);

        for (int i = 0; i < allFeatures.size(); i++) {
            deletemedia(allFeatures.get(i).ID);
        }

        //The delete catcodes from sql db
        MatchingDatabaseAdapter.deleteAllItems();

        //Return
        successCallback.invoke(true);

    }

    /* Private methods */
    private void saveToSD(Mat matImage, String imageName) {

        Log.i("f-C", "Saving to SD");

        //Mat to Bitmap
        Bitmap image = Bitmap.createBitmap(matImage.width(), matImage.height(), Bitmap.Config.ARGB_8888);
        Utils.matToBitmap(matImage, image);

        //Save to sd
        //File sdCardDirectory = Environment.getExternalStorageDirectory();

        File sdCardDirectory = reactContext.getExternalFilesDir(null);

        //Log.i("f-C", sdCardDirectory.getAbsolutePath());

        File imageFile = new File(sdCardDirectory, imageName + ".png");
        // Encode the file as a PNG image.
        FileOutputStream outStream;
        try {
            outStream = new FileOutputStream(imageFile);
            image.compress(Bitmap.CompressFormat.PNG, 100, outStream);
            /* 100 to keep full quality of the image */
            outStream.flush();
            outStream.close();
        } catch (FileNotFoundException e) {
            Log.i("DEB", "filenotfound");
            e.printStackTrace();
        } catch (IOException e) {
            Log.i("DEB", "ioexception");
            e.printStackTrace();
        }

    }

    private void saveToSDBitmap(Bitmap bitmapImage, String imageName) {

        Log.i("f-C", "Saving to SD (bitmap)");

        //Mat to Bitmap
        //Bitmap image = Bitmap.createBitmap(matImage.width(),matImage.height(), Bitmap.Config.ARGB_8888);
        //Utils.matToBitmap(matImage, image);

        //Save to sd
        //File sdCardDirectory = Environment.getExternalStorageDirectory();

        File sdCardDirectory = reactContext.getExternalFilesDir(null);

        //Log.i("f-C", sdCardDirectory.getAbsolutePath());

        File imageFile = new File(sdCardDirectory, imageName + ".png");
        // Encode the file as a PNG image.
        FileOutputStream outStream;
        try {
            outStream = new FileOutputStream(imageFile);
            bitmapImage.compress(Bitmap.CompressFormat.PNG, 100, outStream);
            /* 100 to keep full quality of the image */
            outStream.flush();
            outStream.close();
        } catch (FileNotFoundException e) {
            Log.i("DEB", "filenotfound");
            e.printStackTrace();
        } catch (IOException e) {
            Log.i("DEB", "ioexception");
            e.printStackTrace();
        }

    }

    void savefile(Uri uri, String destination) {
        //Save the URI in the destination
        try {
            InputStream in = reactContext.getContentResolver().openInputStream(uri);
            OutputStream out = new FileOutputStream(new File(destination));
            byte[] buf = new byte[1024];
            int len;
            while ((len = in.read(buf)) > 0) {
                out.write(buf, 0, len);
            }
            out.close();
            in.close();
        } catch (IOException ex) {
            Log.i("f-C", "Error saving this file");
            ex.printStackTrace();
        }
    }

    //getCatcodeObj
    //Compose a catcode JSON object
    JSONObject getCatcodeObj(String id, String name, String timestamp) {
        JSONObject obj = new JSONObject();
        try {
            obj.put("id", id);
            obj.put("name", name);
            obj.put("timestamp", timestamp);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return obj;
    }

    //this function delete all Media files (audio, video, image) saved in SD, associated with a catcode by id
    void deletemedia(String id) {
        //Delete media (image, audio, video) associated with it
        Features catcode = MatchingDatabaseAdapter.getItem(id);

        try {
            //Create Json array from attachments string
            JSONObject o = new JSONObject(catcode.attachments);

            //Get type
            String type = o.getString("type");

            //Get attachment id
            String attachmentId = o.getString("id");

            String destination = "";

            //if is a Media type
            if (type.equals("image")) {
                //Get URI
                String stringUri = o.getString("uri");
                //Get extension from the URI
                String extension = stringUri.substring(stringUri.lastIndexOf("."));

                //Create the destination path (external SD)
                destination = reactContext.getExternalFilesDir(null).getAbsolutePath() + File.separatorChar + attachmentId + extension;
            } else if (type.equals("video") || (type.equals("audio"))) {
                //Get extension from the URI
                String extension = o.getString("extension");

                //Create the destination path (external SD)
                destination = reactContext.getExternalFilesDir(null).getAbsolutePath() + File.separatorChar + attachmentId + "." + extension;
            } else if (type.equals("pdf")) {
                //Create the destination path (external SD)
                destination = reactContext.getExternalFilesDir(null).getAbsolutePath() + File.separatorChar + attachmentId + ".pdf";
            }

            if (!destination.isEmpty()) {

                //Log.i("f-C", "destination is: " + destination);

                //Check if the file already exist
                File file = new File(destination);
                if (file.exists()) {
                    if (file.delete()) {
                        Log.i("f-C", "file Deleted");
                    } else {
                        Log.i("f-C", "file not Deleted");
                    }
                }
            }

        } catch (JSONException err) {
            Log.d("Error", err.toString());
        }
    }

    //This algorithm perform a react transformation (rotation 90°)
    private Rect rotatedRect(RectF location, int width, int height){
        //Compute A rect
        int Ax = Math.round(location.left);
        int Ay = Math.round(location.top);
        int Aw = Math.round(location.width());
        int Ah = Math.round(location.height());

        //Compute B rect
        int Bx = Ay;
        int By = TF_OD_API_INPUT_SIZE - Ax;
        int Bw = Ah;
        int Bh = Aw;

        //Compute B1 rect
        int B1x = Bx;
        int B1y = By - Bh;

        //Compute C rect
        int Cx = B1x * width / TF_OD_API_INPUT_SIZE;
        int Cy = B1y * height / TF_OD_API_INPUT_SIZE;
        int Cw = Bw * width / TF_OD_API_INPUT_SIZE;
        int Ch = Bh * height / TF_OD_API_INPUT_SIZE;

        return new Rect(Cx, Cy, Cw, Ch);
    }

    private Mat preprocess(Mat image){

        //Resize to a fixed size
        Mat output = new Mat();
        Imgproc.resize(image, output, new Size(TF_GENERATOR_INPUT_SIZE, TF_GENERATOR_INPUT_SIZE));

        //Transform to gray
        Imgproc.cvtColor(output, output, Imgproc.COLOR_BGR2GRAY);

        //Normalize color
        Core.normalize(output, output, 0, 255, Core.NORM_MINMAX);

        return output;
    }

    private Bitmap getResizedBitmap(Bitmap bm, int newWidth, int newHeight) {
        int width = bm.getWidth();
        int height = bm.getHeight();
        float scaleWidth = ((float) newWidth) / width;
        float scaleHeight = ((float) newHeight) / height;
        // CREATE A MATRIX FOR THE MANIPULATION
        Matrix matrix = new Matrix();
        // RESIZE THE BIT MAP
        matrix.postScale(scaleWidth, scaleHeight);
        // "RECREATE" THE NEW BITMAP
        Bitmap resizedBitmap = Bitmap.createBitmap(bm, 0, 0, width, height, matrix, false);
        bm.recycle();
        return resizedBitmap;
    }

    //This function compute the distance between two neural code.
    private float distance(float[] a, float[] b){
        float sum = 0.0f;
        for (int i = 0; i < a.length; i++) {
            sum += Math.abs(a[i] - b[i]);
        }
        return sum;
    }

    private int findMinimum(float[] a){
        float min = a[0];
        int minIndex = 0;

        for (int i = 1; i < a.length; i++) {
            if (a[i] < min) {
                min = a[i];
                minIndex = i;
            }
        }

        return minIndex;
    }

    private boolean validateCatcode(Classifier.Recognition result){
        if (result.getTitle().equals("catcode") || (result.getConfidence() > MINIMUM_CONFIDENCE_TF_OD_API)){

            //Calculate if the code is centered horizontally
            float x1 = 150-result.getLocation().left;
            float x2 = result.getLocation().right-150;
            float horizontalCenterAmount = Math.abs(x1-x2);

            //Calculate if the code is centered vertically
            float y1 = 150-result.getLocation().top;
            float y2 = result.getLocation().bottom-150;
            float verticalCenterAmount = Math.abs(y1-y2);

            if ((horizontalCenterAmount<50)&&(verticalCenterAmount<50)){
                return true;
            }
        }

        return false;
    }

}