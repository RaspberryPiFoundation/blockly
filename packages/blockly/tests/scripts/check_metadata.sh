#!/bin/bash

# Checks the size of generated files and verifies they aren't growing
# unreasonably.  Assumes the compressed files have already been built.

# The ..._EXPECTED values should be updated with each release.
# Run this script to get the new values.

# Location of the pre-built compressed files.
#
# (TODO(#5007): Should fetch this from scripts/gulpfiles/config.js
# instead of hardcoding it here.
readonly RELEASE_DIR='dist'

# These values should be updated with each release.  (Note that the
# historic values are tab-delimited.)

# Size of blockly_compressed.js
# Q2 2019	2.20190722.0	812688
# Q3 2019	3.20191014.0	538781
# Q4 2019	3.20200123.0	609855
# Q1 2020	3.20200402.0	619341
# Q2 2020	3.20200625.0	621811
# Q3 2020	3.20200924.0	641216
# Q4 2020	4.20201217.0	653624
# Q1 2021	5.20210325.0	653957
# Q2 2021	6.20210701.0	664497
# Q3 2021	6.20210701.0	731695 (mid-quarter goog.module conversion)
# Q3 2021	6.20210701.0	808807 (late-quarter goog.module conversion)
# Q4 2021	7.20211209.0-beta.0	920002
# Q4 2021	7.20211209.0	929665
# Q2 2022	8.0.0	928056
# Q3 2022	8.0.0	1040413 (mid-quarter typescript conversion)
# Q4 2022	8.0.0	870104
# Q4 2022	9.1.1	903357
# Q1 2023	9.2.1	909181
# Q2 2023	9.3.3	887618
# Q3 2023	10.1.3	898859
# Q4 2023	10.2.2	903535
# Q1 2024	10.3.1	914366
# Q2 2024	11.0.0	905365
# Q2 2025	11.2.2	922504
readonly BLOCKLY_SIZE_EXPECTED=922504

# Size of blocks_compressed.js
# Q2 2019	2.20190722.0	75618
# Q3 2019	3.20191014.0	76455
# Q4 2019	3.20200123.0	75629
# Q1 2020	3.20200402.0	75805
# Q2 2020	3.20200625.0	76360
# Q3 2020	3.20200924.0	76429
# Q4 2020	4.20201217.0	76693
# Q1 2021	5.20210325.0	76693
# Q2 2021	6.20210701.0	76669
# Q3 2021	6.20210701.0	76669
# Q4 2021	7.20211209.0-beta.0	82054
# Q4 2021	7.20211209.0	86966
# Q2 2022	8.0.0	90769
# Q3 2022	8.0.0	102176 (mid-quarter typescript conversion)
# Q4 2022	8.0.0	102213
# Q4 2022	9.1.1	102190
# Q1 2023	9.2.1	101114
# Q2 2023	9.3.3	91848
# Q3 2023	10.1.3	90150
# Q4 2023	10.2.2	90269
# Q1 2024	10.3.1	90269
# Q2 2024	11.0.0	88376
# Q2 2025	11.2.2	88845
readonly BLOCKS_SIZE_EXPECTED=88845

# Size of blockly_compressed.js.gz
# Q2 2019	2.20190722.0	180925
# Q3 2019	3.20191014.0	119064
# Q4 2019	3.20200123.0	131897
# Q1 2020	3.20200402.0	134133
# Q2 2020	3.20200625.0	135181
# Q3 2020	3.20200924.0	138003
# Q4 2020	4.20201217.0	138115
# Q1 2021	5.20210325.0	136118
# Q2 2021	6.20210701.0	142112
# Q3 2021	6.20210701.0	147476 (mid-quarter goog.module conversion)
# Q3 2021	6.20210701.0	152025 (late-quarter goog.module conversion)
# Q4 2021	7.20211209.0-beta.0	169863
# Q4 2021	7.20211209.0	171759
# Q2 2022	8.0.0	173997
# Q3 2022	8.0.0	185766 (mid-quarter typescript conversion)
# Q4 2022	8.0.0	175140
# Q4 2022	9.1.1	179306
# Q1 2023	9.2.1	179814
# Q2 2023	9.3.3	175206
# Q3 2023	10.1.3	180553
# Q4 2023	10.2.2	181474
# Q1 2024	10.3.1	184237
# Q2 2024	11.0.0	182249
# Q2 2025	11.2.2	185336
readonly BLOCKLY_GZ_SIZE_EXPECTED=185336

# Size of blocks_compressed.js.gz
# Q2 2019	2.20190722.0	14552
# Q3 2019	3.20191014.0	15064
# Q4 2019	3.20200123.0	14897
# Q1 2020	3.20200402.0	14966
# Q2 2020	3.20200625.0	15195
# Q3 2020	3.20200924.0	15231
# Q4 2020	4.20201217.0	15224
# Q1 2021	5.20210325.0	15285
# Q2 2021	6.20210701.0	15275
# Q3 2021	6.20210701.0	15284
# Q4 2021	7.20211209.0-beta.0	16616
# Q4 2021	7.20211209.0	15760
# Q2 2022	8.0.0	16192
# Q3 2022	8.0.0	17016 (mid-quarter typescript conversion)
# Q4 2022	8.0.0	17188
# Q4 2022	9.1.1	17182
# Q1 2023	9.2.1	17262
# Q2 2023	9.3.3	16736
# Q3 2023	10.1.3	16508
# Q4 2023	10.2.2	16442
# Q1 2024	10.3.1	16533
# Q2 2024	11.0.0	15815
# Q2 2025	11.2.2	15887
readonly BLOCKS_GZ_SIZE_EXPECTED=15887

# ANSI colors
readonly BOLD_GREEN='\033[1;32m'
readonly BOLD_RED='\033[1;31m'
readonly ANSI_RESET='\033[0m'

# Terminate immediately with non-zero status if any command exits
# with non-zero status, printing a nice message.
set -e
function fail {
  echo -e "${BOLD_RED}Error while checking metadata.${ANSI_RESET}" >&2
}
trap fail ERR

# GZip them for additional size comparisons (keep originals, force
# overwite previously-gzipped copies).
echo "Zipping the compressed files"
gzip -kf "${RELEASE_DIR}/blockly_compressed.js"
gzip -kf "${RELEASE_DIR}/blocks_compressed.js"

# Check the sizes of the files

has_failed=0

compare_size() {
  local name="$1"
  local expected="$2"
  local compare=$(echo "${expected} * 1.1 / 1" | bc)

  local size=$(wc -c <"${name}")

  if (( $size > $compare))
  then
    echo -ne "${BOLD_RED}Failed: Size of ${name} has grown more than 10%. " >&2
    echo -e "${size} vs ${expected} ${ANSI_RESET}" >&2
    has_failed=1
  else
    echo -ne "${BOLD_GREEN}Size of ${name} at ${size} compared to previous " >&2
    echo -e "${expected}.${ANSI_RESET}"
  fi
}

compare_size "${RELEASE_DIR}/blockly_compressed.js" $BLOCKLY_SIZE_EXPECTED
compare_size "${RELEASE_DIR}/blocks_compressed.js" $BLOCKS_SIZE_EXPECTED
compare_size "${RELEASE_DIR}/blockly_compressed.js.gz" $BLOCKLY_GZ_SIZE_EXPECTED
compare_size "${RELEASE_DIR}/blocks_compressed.js.gz" $BLOCKS_GZ_SIZE_EXPECTED

exit $has_failed
