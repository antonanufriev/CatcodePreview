package com.reactlibrary;

import org.opencv.core.Mat;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

public class MyUtils {

    private static final MyUtils ourInstance = new MyUtils();

    static MyUtils getInstance() {
        return ourInstance;
    }

    private MyUtils() {
    }

    static ByteBuffer convertMattoTfLiteInput(Mat mat)
    {
        ByteBuffer imgData = null;
        imgData = ByteBuffer.allocateDirect(100 * 100 * 4);
        imgData.order(ByteOrder.nativeOrder());
        imgData.rewind();
        int pixel = 0;
        for (int i = 0; i < 100; ++i) {
            for (int j = 0; j < 100; ++j) {
                imgData.putFloat((float)mat.get(i,j)[0]);
            }
        }
        return imgData;

    }
}
