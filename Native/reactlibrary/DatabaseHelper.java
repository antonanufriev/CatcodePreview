package com.reactlibrary;

import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.util.Log;

class DatabaseHelper extends SQLiteOpenHelper {
    private static DatabaseHelper mDatabaseHelper;
    private static final String DB_NAME = "blobDb";
    private static final int DB_VERSION = 1;
    private String TAG = "DatabaseHelper";
    static final String TABLE_NAME = "blobTable";
    //        [ ID ]
    static final String ID_FIELD_NAME = "_id";
    static final int ID_FIELD_POSITION = 0;
    //        [ name ]
    static final String IMG_NAME_FIELD_NAME = "name";
    static final int IMG_NAME_FIELD_POSITION = 1;
    //        [ timestamp ]
    static final String TIMESTAMP_FIELD_NAME = "timestamp";
    static final int TIMESTAMP_FIELD_POSITION = 2;

    static final String NEURALCODE_BLOB_FIELD_NAME = "neuralcodeBlobField";
    static final int NEURALCODE_BLOB_FIELD_POSITION = 3;

    //        [ attachment ]
    static final String ATTACHMENTS_FIELD_NAME = "attachments";
    static final int ATTACHMENTS_FIELD_POSITION = 4;

    private static final java.lang.String CREATE_TABLE_SQL =
            "CREATE TABLE " + TABLE_NAME + " ("
                    + ID_FIELD_NAME + " INTEGER PRIMARY KEY AUTOINCREMENT, "
                    + IMG_NAME_FIELD_NAME + " TEXT, "
                    + TIMESTAMP_FIELD_NAME + " TEXT, "
                    + NEURALCODE_BLOB_FIELD_NAME + " BLOB, "
                    + ATTACHMENTS_FIELD_NAME + " TEXT"
                    + ");";

    private DatabaseHelper(Context context) {
        super(context, DB_NAME, null, DB_VERSION);
        mDatabaseHelper = this;
    }

    static synchronized DatabaseHelper getInstance(Context context) {
        if (mDatabaseHelper == null) {
            mDatabaseHelper = new DatabaseHelper(context.getApplicationContext());
        }
        return mDatabaseHelper;
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        Log.v(TAG, "Creating table: " + CREATE_TABLE_SQL);
        db.execSQL(CREATE_TABLE_SQL);
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        Log.v(TAG, "onUpgrade() from " + oldVersion + " to " + newVersion);
        Log.v(TAG, "ALL DATA BEING REMOVED FROM THE DATABASE!!");
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_NAME + ";");
        onCreate(db);
    }

}
