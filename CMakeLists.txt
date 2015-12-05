cmake_minimum_required(VERSION 3.3)
project(nightscout-graph-pebble C)

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11")

set(SOURCE_FILES
    src/app_keys.h
    src/battery_component.c
    src/battery_component.h
    src/bg_row_element.c
    src/bg_row_element.h
    src/comm.c
    src/comm.h
    src/config.c
    src/config.h
    src/connection_status_component.c
    src/connection_status_component.h
    src/format.c
    src/format.h
    src/graph_element.c
    src/graph_element.h
    src/layout.c
    src/layout.h
    src/main.c
    src/preferences.c
    src/preferences.h
    src/sidebar_element.c
    src/sidebar_element.h
    src/staleness.c
    src/staleness.h
    src/status_bar_element.c
    src/status_bar_element.h
    src/text_updates.c
    src/text_updates.h
    src/time_element.c
    src/time_element.h
    src/trend_arrow_component.c
    src/trend_arrow_component.h)


# Load our modules for this project
set(CMAKE_MODULE_PATH ${CMAKE_SOURCE_DIR}/cmake/modules)

find_package(Pebble)
include_directories(SYSTEM ${PEBBLE_INCLUDE_DIR})

add_executable(dummy_pebble
        EXCLUDE_FROM_ALL
        ${SOURCE_FILES})