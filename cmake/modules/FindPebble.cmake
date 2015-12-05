# 	Find Pebble SDK
#
#	Author: Björn Berg, bjoern.berg@gmx.de
#	Date:	2015-07-27
#
#	Redistribution and use is allowed according to the terms of the BSD license.
# 	For details see the accompanying COPYING-CMAKE-SCRIPTS file.
#
#	This find_package module helps to find the Pebble SDK and adds Pebble specific
#	targets to the Makefile. This can be helpful if you are working with an IDE like
#	Eclipse or Netbeans.
#
#	PEBBLE_ROOT_DIR		-	Pebble root directory
#	PEBBLE_INCLUDE_DIR	-	where to find pebble.h
#	PEBBLE_FOUND		-	True if Pebble SDK found
#

if (DEFINED PEBBLE_ROOT_DIR)
	# check if ROOT_DIR is valid
	find_file ( VERSION_FILE 
		NAMES version.txt
		HINTS ${PEBBLE_ROOT_DIR})
		
	if (DEFINED VERSION_FILE)
		# add include file from aplite
		find_path ( PEBBLE_INCLUDE_DIR
			NAMES pebble.h
			HINTS ${PEBBLE_ROOT_DIR}/Pebble/aplite/include)
	else (DEFINED VERSION_FILE)
		message(FATAL_ERROR "${PEBBLE_ROOT_DIR} is not a valid Pebble SDK installation.")
		set (PEBBLE_FOUND false)
	endif (DEFINED VERSION_FILE)	
else (DEFINED PEBBLE_ROOT_DIR)
	message(FATAL_ERROR "Please set PEBBLE_ROOT_DIR to the Pebble SDK installation path.")
	set (PEBBLE_FOUND false)
endif (DEFINED PEBBLE_ROOT_DIR)
set (PEBBLE_PHONE "192.168.0.52" CACHE STRING "Pebble IP address")
		  
if (DEFINED PEBBLE_INCLUDE_DIR)
	set (PEBBLE_PROGRAM ${PEBBLE_ROOT_DIR}/bin/pebble)
	
	# Add some pebble specific targets to the build
	# pebble-build is always executed when target 'all' is called
	add_custom_target(pebble-build
			ALL ${PEBBLE_PROGRAM} build
			WORKING_DIRECTORY ${PROJECT_SOURCE_DIR})

	add_custom_target(pebble-logs
			ALL ${PEBBLE_PROGRAM} logs --phone=${PEBBLE_PHONE})

	# pebble-clean depends on clean 
	add_custom_target(pebble-clean ${PEBBLE_PROGRAM} clean
			WORKING_DIRECTORY ${PROJECT_SOURCE_DIR})

	add_custom_target(pebble-emulate-aplite
			${PEBBLE_PROGRAM} install --emulator basalt ${PROJECT_SOURCE_DIR}/build/${CMAKE_PROJECT_NAME}.pbw
			DEPENDS pebble-build
			WORKING_DIRECTORY ${PROJECT_SOURCE_DIR})

	add_custom_target(pebble-emulate-basalt
			${PEBBLE_PROGRAM} install --emulator basalt ${PROJECT_SOURCE_DIR}/build/${CMAKE_PROJECT_NAME}.pbw
			DEPENDS pebble-build
			WORKING_DIRECTORY ${PROJECT_SOURCE_DIR})

	add_custom_target(pebble-emulate-chalk
			${PEBBLE_PROGRAM} install --emulator basalt ${PROJECT_SOURCE_DIR}/build/${CMAKE_PROJECT_NAME}.pbw
			DEPENDS pebble-build
			WORKING_DIRECTORY ${PROJECT_SOURCE_DIR})

	# pebble-install installs app and starts logging
	# pebble-emulate starts the emulator
	if (DEFINED PEBBLE_PHONE)
		add_custom_target(pebble-install
				      ${PEBBLE_PROGRAM} install --logs --phone=${PEBBLE_PHONE}
					  DEPENDS pebble-build
					  WORKING_DIRECTORY ${PROJECT_SOURCE_DIR})
	else (DEFINED PEBBLE_PHONE)
		message(STATUS "Environment variable PEBBLE_PHONE not found.")
		message(STATUS "target 'pebble-install' not added.")
		message(STATUS "target 'pebble-emulate' not added.")
	endif (DEFINED PEBBLE_PHONE)
	
	set (PEBBLE_FOUND true)
endif (DEFINED PEBBLE_INCLUDE_DIR)	

# Set output variables
mark_as_advanced (PEBBLE_INCLUDE_DIR)


