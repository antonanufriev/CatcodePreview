package com.tflite;

// Import libraries
import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.content.res.AssetManager;
import org.tensorflow.lite.Interpreter;
import org.tensorflow.lite.gpu.GpuDelegate;

import java.io.FileInputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.util.HashMap;
import java.util.Map;

// Define class for classificaiton
public class NeuralCodeGenerator {


    // Define inferencing interface for our model
    private Interpreter inferenceInterfacess;

    private static final boolean USE_GPU = true;

    // Load model byte buffer by calling "loadModelFile" method.
    public NeuralCodeGenerator(final Context context, String model_file)  throws IOException {
        AssetManager assetManager = context.getAssets();
        Interpreter.Options options = new Interpreter.Options();

        if (USE_GPU) {
            GpuDelegate delegate = new GpuDelegate();
            options.addDelegate(delegate);
        }
        inferenceInterfacess = new Interpreter(loadModelFile(assetManager, model_file), options);

    }

    private static ByteBuffer loadModelFile(AssetManager assets, String model_file)
            throws IOException {
        AssetFileDescriptor fileDescriptor = assets.openFd(model_file);
        FileInputStream inputStream = new FileInputStream(fileDescriptor.getFileDescriptor());
        FileChannel fileChannel = inputStream.getChannel();
        long startOffset = fileDescriptor.getStartOffset();
        long declaredLength = fileDescriptor.getDeclaredLength();
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength);
    }



    // Get prediction from model by giving input the "data" and getting result in a 1x1 array.

    // Return the result to be shown on screen.
    public float[][] predictProbabilities(ByteBuffer data) {
        float[][] output = new float[1][2048];
        Object[] inputs = {data};
        Map<Integer, Object> outputs = new HashMap<>();
        outputs.put(0, output);

        inferenceInterfacess.runForMultipleInputsOutputs(inputs, outputs);

        return output;
    }


}
