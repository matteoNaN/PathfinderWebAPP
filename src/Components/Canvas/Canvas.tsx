/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef } from 'react';
import MainRenderService from '../../Services/MainRenderService';
import DrawingService from '../../Services/DrawingService';

const BabylonCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const initializeScene = async () => {
            if (canvasRef.current) {
                await MainRenderService.createScene(canvasRef.current);
                
                // Initialize drawing service after scene is created
                const scene = MainRenderService.getScene();
                if (scene) {
                    DrawingService.initialize(scene);
                }
            }
        };

        initializeScene();

        return () => {
            MainRenderService.dispose();
        };
    }, []);

    return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
};

export default BabylonCanvas;
