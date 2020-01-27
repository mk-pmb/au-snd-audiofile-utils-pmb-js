#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-
exec nodemjs "$(readlink -m "$BASH_SOURCE"/../..)"/src/cli.mjs "$@"; exit $?
