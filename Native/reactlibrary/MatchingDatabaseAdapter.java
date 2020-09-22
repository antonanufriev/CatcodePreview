package com.reactlibrary;


import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.SQLException;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.util.Log;

//import org.json.JSONObject;
import org.opencv.core.Mat;
import org.opencv.core.MatOfKeyPoint;

import java.nio.ByteBuffer;
import java.nio.FloatBuffer;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.TimeZone;

import static android.content.ContentValues.TAG;

public class MatchingDatabaseAdapter {

    static DatabaseHelper dbHelpder;
    static SQLiteDatabase mDb;
    static SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");

    static void init(Context mContext) {
        dbHelpder = DatabaseHelper.getInstance(mContext);
    }

    //public static void addItem(String name, MatOfKeyPoint keyPoints, Mat descriptors, String attachments, Context context) {
    public static void addItem(String name, float[] neuralcode, String attachments, Context context) {
        ByteBuffer buffer = ByteBuffer.allocate(neuralcode.length * 4);
        for (int i = 0; i < neuralcode.length; i++) {
            buffer.putFloat(neuralcode[i]);
        }
        byte[] neuralCodeByteArray = buffer.array();

        // Get UTC time
        String gmtTime = df.format(new Date());
        addFullBlob(name, gmtTime, neuralCodeByteArray, attachments);
    }

    public static void addFullBlob(String name, String gmtTime, byte[] neuralcodeBlob, String attachments) throws SQLException {
        if (mDb == null) mDb = openDb(false);
        ContentValues contentValues = new ContentValues();
        contentValues.put(DatabaseHelper.IMG_NAME_FIELD_NAME, name);
        contentValues.put(DatabaseHelper.TIMESTAMP_FIELD_NAME, gmtTime);
        contentValues.put(DatabaseHelper.NEURALCODE_BLOB_FIELD_NAME, neuralcodeBlob);
        contentValues.put(DatabaseHelper.ATTACHMENTS_FIELD_NAME, attachments);
        long x = mDb.insert(DatabaseHelper.TABLE_NAME, null, contentValues);
    }

    static SQLiteDatabase openDb(boolean isReadOnly) {
        return isReadOnly ? dbHelpder.getReadableDatabase() : dbHelpder.getWritableDatabase();
    }

    static void close() {
        dbHelpder.close();
    }

    static ArrayList<Features> getAllItems(String[] columns) {
        if (mDb == null || !mDb.isOpen()) mDb = openDb(true);
        ArrayList<Features> featuresList = new ArrayList<>();
        Cursor mCursor;
        mCursor = mDb.query(DatabaseHelper.TABLE_NAME, columns, null, null,
                null, null, DatabaseHelper.TIMESTAMP_FIELD_NAME + " DESC");
        while(mCursor.moveToNext()) {
            featuresList.add(getFeatureFromCursor(mCursor, columns));
        }
        Log.v(TAG, "Get All features from DB. Total Count :" + featuresList.size());
        return featuresList;
    }

    public static Features getFeatureFromCursor(Cursor mCursor, String[] columns) {
        float[] neuralcode = null;
        Date timestamp = null;
        String attachments = null;
        String name = null;
        String ID = null;
        if (mCursor != null) {
            Log.v(TAG, "mCursor has " + mCursor.getCount());
            ID = mCursor.getString(DatabaseHelper.ID_FIELD_POSITION);
            name = mCursor.getString(DatabaseHelper.IMG_NAME_FIELD_POSITION);
            String timestampStr = mCursor.getString(DatabaseHelper.TIMESTAMP_FIELD_POSITION);

            if(columns == null) {
                byte[] blob = mCursor.getBlob(DatabaseHelper.NEURALCODE_BLOB_FIELD_POSITION);
                ByteBuffer buffer = ByteBuffer.wrap(blob);
                FloatBuffer floatBuffer = buffer.asFloatBuffer();
                neuralcode = new float[floatBuffer.limit()];
                floatBuffer.get(neuralcode);

                attachments = mCursor.getString(DatabaseHelper.ATTACHMENTS_FIELD_POSITION);
            }

            try {
                timestamp = df.parse(timestampStr);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        Features features = new Features();
        features.setID(ID);
        features.setName(name);
        features.setTimestamp(timestamp);
        features.setNeuralcode(neuralcode);
        features.setAttachments(attachments);
        return features;
    }

    public static Features getItem(String id) {
        Features features = new Features();
        if (mDb == null || !mDb.isOpen()) mDb = openDb(true);
        Cursor mCursor = null;
        mCursor = mDb.query(DatabaseHelper.TABLE_NAME, null,
                DatabaseHelper.ID_FIELD_NAME + "=?", new String[]{id}, null, null, null);
        if (mCursor.moveToFirst())
            features = getFeatureFromCursor(mCursor, null);
        return features;
    }

    /**
     * Update the Database Item
     */
    public static boolean updateItem(String id, String name, String attachments) {
        if (mDb == null) mDb = openDb(false);
        ContentValues contentValues = new ContentValues();

        //Update name, only if set
        if (!name.isEmpty()){
            contentValues.put(DatabaseHelper.IMG_NAME_FIELD_NAME, name);
        }
        contentValues.put(DatabaseHelper.ATTACHMENTS_FIELD_NAME, attachments);
        try {
            mDb.update(DatabaseHelper.TABLE_NAME, contentValues, DatabaseHelper.ID_FIELD_NAME + "=" + id, null);
            Log.v(TAG, "Update the Database ID: " + id + " row ");
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Delete the database item
     * */
    public static boolean deleteItem(String id) {
        try {
            return mDb.delete(DatabaseHelper.TABLE_NAME, DatabaseHelper.ID_FIELD_NAME + "=" + id, null) > 0;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Delete the all Database
     * */
    public static boolean deleteAllItems() {
        try {
            mDb.execSQL("delete from "+ DatabaseHelper.TABLE_NAME);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // INNER CLASS DatabaseHelper

}