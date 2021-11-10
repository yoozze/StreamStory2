import * as d3 from 'd3';
import React, { useEffect, useRef, useState } from 'react';
import {
    createSVG,
    getSVG,
    createLinearScale,
    createNodes,
    createLinks,
    createMarkers,
    createGraphContainer,
    getGraphContainer,
    findMinMaxValues,
    createGraphData,
    addColorsToScaleStates,
    addCoordinatesToStates,
} from '../utils/markovChainUtils';
import { ModelVisualizationProps } from './ModelVisualization';
import { createSlider } from '../utils/sliderUtils';
import { TRANSITION_PROPS } from '../types/charts';

const MarkovChain = ({ model, onStateSelected }: ModelVisualizationProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [debug] = useState<boolean>(false);
    const [initialized, setInitialized] = useState<boolean>(false);
    const [currentScaleIx, setCurrentScaleIx] = useState<number>(0);
    const [maxRadius] = useState<number>(130);
    const [currScaleIx] = useState<number>(0);
    const [data, setData] = useState<any>();
    const [windowSize] = useState<any>({ width: undefined, height: undefined });
    const [pThreshold, setPThreshold] = useState<number>(0.1);
    const [sliderProbPrecision] = useState<number>(2);
    const [theme, setTheme] = useState<any>();

    const darkTheme = {
        backgroundColor: '#272b30',
        state: {
            default: {
                stroke: '#a0a0a0',
                opacity: 0.9,
            },
            selected: {
                stroke: '#337ab7',
                opacity: 0.9,
            },
        },
        link: {
            default: {
                stroke: '#a0a0a0',
            },
            selected: {
                stroke: '#337ab7',
            },
        },
        marker: {
            default: {
                stroke: '#a0a0a0',
                fill: '#a0a0a0',
            },
            selected: {
                stroke: '#337ab7',
                fill: '#337ab7',
            },
        },
        slider: {
            default: {
                trackStrokeWidth: '8px',
                trackInsetStrokeWidth: '2px',
                opacity: 0.1,
            },
            mouseOver: {
                trackStrokeWidth: '10px',
                trackInsetStrokeWidth: '8px',
                opacity: 0.4,
            },
        },
    };

    useEffect(() => {
        if (model.model.scales && model.model.scales.length) {
            console.log('model.model.scales=', model.model.scales);
            addColorsToScaleStates(model.model.scales);
            addCoordinatesToStates(model.model.scales, maxRadius, debug);
            const graphData = createGraphData(model.model.scales, pThreshold);
            setData(graphData);
            setTheme(darkTheme);
            renderMarkovChain(graphData);
        }
    }, [model.model.scales]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (
            pThreshold >= 0 &&
            currentScaleIx >= 0 &&
            model.model.scales &&
            model.model.scales.length &&
            data &&
            data.length
        ) {
            const graphData = createGraphData(model.model.scales, pThreshold);
            setData(graphData);
            renderMarkovChain(data);
        }
    }, [windowSize, pThreshold, currentScaleIx]); // eslint-disable-line react-hooks/exhaustive-deps

    function renderMarkovChain(graphData: any): void {
        const boundary = findMinMaxValues(model.model.scales);
        const width = containerRef?.current?.offsetWidth || 150; // FIXME: hardcoded
        const height = 700; // FIXME: hardcoded
        const margin = { top: 5, right: 5, bottom: 10, left: 10 }; // FIXME: hardcoded
        const chart = { top: 2, left: 2 }; // FIXME: hardcoded
        const xWidth = width - chart.left - margin.left - margin.right;
        const yWidth = height - chart.top - margin.top - margin.bottom;

        if (graphData && model.model.scales[currentScaleIx]) {
            let graph = null;
            let graphContainer = null;
            let gNodes = null;
            let gLinks = null;
            let gMarkers = null;
            let gSliderProb = null;
            let gSliderScale = null;

            if (!initialized) {
                graph = createSVG(containerRef, width, height, margin);
                graphContainer = createGraphContainer(graph, width, height, chart);
                gLinks = graphContainer.append('g').attr('class', 'links');
                gNodes = graphContainer.append('g').attr('class', 'nodes');
                gMarkers = graphContainer.append('g').attr('class', 'markers');
                gSliderProb = graphContainer.append('g').attr('class', 'slider_prob');
                gSliderScale = graphContainer.append('g').attr('class', 'c');
                setInitialized(true);
            } else {
                graph = getSVG(containerRef, width, height, margin);
                graphContainer = getGraphContainer(graph);
                gLinks = graphContainer.select('g.links');
                gNodes = graphContainer.select('g.nodes');
                gMarkers = graphContainer.select('g.markers');
                gSliderProb = graphContainer.select('g.slider_prob');
                gSliderScale = graphContainer.select('g.slider_scale');
            }
            const x = createLinearScale([boundary.x.min, boundary.x.max], [0, xWidth]);
            const y = createLinearScale([boundary.y.max, boundary.y.min], [yWidth, 0]);
            const r = createLinearScale(
                [boundary.r.min, boundary.r.max],
                [yWidth / 20, yWidth / 5],
            );
            const xSliderProb = createLinearScale([0, 1], [0, xWidth]).clamp(true);
            const ySliderScale = createLinearScale(
                [0, model.model.scales.length],
                [yWidth, 0],
            ).clamp(true);

            const format2Decimals = d3.format(`.${sliderProbPrecision}f`); // FIXME: move to another file
            const formatInt = d3.format('.0f'); // FIXME: move to another file

            createNodes(
                darkTheme, // FIXME: put another variable
                graphData[currentScaleIx],
                gNodes,
                gLinks,
                gMarkers,
                tooltipRef,
                x,
                y,
                r,
                TRANSITION_PROPS,
                handleOnStateSelected,
            );
            if (!initialized) {
                createSlider(
                    darkTheme, // FIXME: another variable
                    gSliderProb,
                    xSliderProb,
                    yWidth,
                    pThreshold,
                    false,
                    true,
                    true,
                    format2Decimals,
                    handleOnProbChanged,
                );

                createSlider(
                    darkTheme, // FIXME: another variable
                    gSliderScale,
                    ySliderScale,
                    yWidth,
                    currScaleIx,
                    true,
                    false,
                    false,
                    formatInt,
                    handleOnScaleChanged,
                );
            }
            createLinks(darkTheme, graphData[currentScaleIx], gNodes, gLinks, TRANSITION_PROPS);
            createMarkers(darkTheme, graphData[currentScaleIx], gMarkers);
        }
    }

    function handleOnStateSelected(event: any, stateNo: number) {
        const selectedState = model.model.scales[currentScaleIx].states.find(
            (state: any) => state.stateNo === stateNo,
        );
        onStateSelected(selectedState);
    }

    function handleOnProbChanged(p: number) {
        setPThreshold(p);
    }

    function handleOnScaleChanged(val: number) {
        setCurrentScaleIx(Math.floor(val));
        onStateSelected(null);
    }

    return (
        <>
            <div ref={tooltipRef} />
            <div ref={containerRef} style={{ backgroundColor: theme?.backgroundColor }} />
        </>
    );
};

export default MarkovChain;