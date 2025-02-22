// animation controls
let wordRevealAC;

//  variables
export let activeRowCounter = 0;
export let playersGuessTracker = [];

export const keyboard = query(document, ".keyboard");
const keys = queryAll(keyboard, "span");
const accentedKeys = queryAll(document, ".accented");
const shiftKeyIcon = query(document, ".shift-icon");

let shiftKeyPress = false;

const unregistered = query(document, ".unregistered");

// pin
const pinCodeKeys = queryAll(keyboard, ".pin-code button");
const reveal = query(document, ".reveal");
let pin = [];
export function keyboardMechanics(e) {
    const target = e.target;

    // pin code
    if (target.matches(".pin-code button") && pin.length < 4) {
        pin.push(target.innerText);

        if (pin.length === 4 && Number(pin.join("")) === 1776) {
            reveal.innerText = GG.guessWord;
            pin = [];

            setTimeout(() => {
                reveal.innerText = "";
            }, 10);
        } else if (pin.length === 4 && Number(pin.join("")) !== 1776) {
            query(document, ".space-icon").animate(
                [
                    {
                        transform: "translate(0, -2px)",
                    },
                ],
                {
                    duration: 300,
                    easing: "ease-in-out",
                }
            );
            pin = [];
        }
    }

    //  letters
    if (
        target.matches(
            ":not(div, .pin-code button, .fourth-row *, .shift, .shift-icon)"
        )
    ) {
        removeClass(unregistered, "show-unregistered");

        for (const slot of GG.activeRowSlots) {
            if (slot.classList.contains("active-slot")) {
                slot.innerText = target.innerText;

                accentShifter("unshift");
            }
        }

        changeActiveSlot(nextActiveSlot());
    }

    //  space
    if (target.matches(".space, .space-icon")) {
        changeActiveSlot(nextActiveSlot("loop"), true);
    }

    //  shift
    if (target.matches(".shift, .shift-icon")) {
        accentShifter("shift");
    }

    //  back space
    if (target.matches(".back-space, .back-space-icon")) {
        changeActiveSlot(previousActiveSlot(), true);
    }

    //  enter
    if (target.matches(".enter, .enter-icon")) {
        const guessWord = [...GG.guessWord];
        let playersGuess = [];

        let greenSlotsTracker = 0;

        //  empty or not
        const hasEmptySlots = (() => {
            let emptySlotsIndex = [];

            GG.activeRowSlots.forEach((slot, index) => {
                const letter = slot.innerText;

                if (letter === "") {
                    slot.animate(A.emptySlotP, A.emptySlotTF);

                    emptySlotsIndex.push(index);
                    changeActiveSlot(emptySlotsIndex[0]);
                } else if (letter !== "") {
                    letter === "هـ"
                        ? playersGuess.push("ه")
                        : playersGuess.push(letter);
                }
            });

            !emptySlotsIndex.length
                ? (emptySlotsIndex = false)
                : (emptySlotsIndex = true);

            return emptySlotsIndex;
        })();

        //  valid or not
        const invalidGuess = (() => {
            let result;

            //  valid
            if (
                !hasEmptySlots &&
                DB.dataBase.validWords[M.letterLength].includes(
                    playersGuess.join("")
                )
                // DB.dataBase.validWords[5].includes(playersGuess.join(""))
            )
                // valid
                result = false;
            else if (!hasEmptySlots) {
                //  invalid
                unregisteredPopUp(playersGuess);
                clearInvalidGuess();

                result = true;
            }

            //  duplicate guess
            if (!hasEmptySlots && activeRowCounter > 0) {
                playersGuessTracker.forEach(item => {
                    if (playersGuess.join("") === item[0]) {
                        GG.guessRows[item[1]].animate(
                            A.duplicateGuessP,
                            A.duplicateGuessTF
                        );

                        clearInvalidGuess();
                        result = true;
                    }
                });
            }

            return result;
        })();

        //  correct or not
        if (!hasEmptySlots && !invalidGuess) {
            const activatedRows = Array.from(queryAll(document, ".activated"));

            GG.activeRowSlots.forEach((slot, index, array) => {
                const letter = slot.innerText === "هـ" ? "ه" : slot.innerText;

                //  no letters included
                if (!guessWord.includes(letter)) {
                    slot.animate(
                        A.SlotNotIncludedP,
                        A.SlotNotIncludedTF
                    ).finished.then(() => {
                        for (const key of keys) {
                            if (key.innerText === letter) {
                                key.animate(
                                    A.keyNotIncludedP,
                                    A.keyNotIncludedTF
                                );

                                addClass(key, "key-not-included");
                            }
                        }
                    });
                }

                //  incorrect
                if (
                    guessWord.includes(letter) &&
                    guessWord[index] !== playersGuess[index]
                ) {
                    slot.animate(
                        A.incorrectSlotP,
                        A.incorrectSlotTF
                    ).finished.then(() => {
                        addClass(slot, "incorrect-key");

                        for (const key of keys) {
                            if (
                                key.innerText === letter &&
                                !key.classList.contains("correct-key")
                            ) {
                                key.animate(A.incorrectKeyP, A.incorrectKeyTF);
                                addClass(key, "incorrect-key");
                            }
                        }

                        duplicateRemover(
                            activatedRows,
                            letter,
                            index,
                            "incorrect-key"
                        );
                    });
                }

                //  correct
                if (guessWord[index] === playersGuess[index]) {
                    slot.animate(A.correctSlotP, A.correctSlotTF).finished.then(
                        () => {
                            addClass(slot, "correct-key");

                            for (const key of keys) {
                                if (key.innerText === letter) {
                                    key.animate(
                                        A.correctKeyP,
                                        A.correctKeyTF
                                    ).finished.then(() => {
                                        addClass(key, "correct-key");

                                        duplicateRemover(
                                            activatedRows,
                                            letter,
                                            index,
                                            "correct-key"
                                        );
                                    });
                                }
                            }
                        }
                    );

                    greenSlotsTracker++;
                }
            });

            playersGuessTracker.push([playersGuess.join(""), activeRowCounter]);

            GG.rowActiveState(GG.guessRows[activeRowCounter], "deactive");

            log(playersGuessTracker);
        }

        //  game won
        const gameWon = (() => {
            let gameWon = false;

            if (greenSlotsTracker === guessWord.length) {
                // game won
                removeEl(keyboard, "click", keyboardMechanics);

                GG.word.innerText = GG.guessWord;
                GG.word.style.opacity = 1;

                setTimeout(() => {
                    // greened slots
                    GG.activeRowSlots.forEach((slot, index) => {
                        const greenify = slot.animate(A.winningAnimeP, {
                            duration: 500,
                            // delay based
                            delay: index * 120,
                        });

                        if (index === GG.activeRowSlots.length - 1) {
                            greenify.finished.then(() => {
                                removeClass(keyboard, "show-keyboard");
                                addEl(
                                    keyboard,
                                    "transitionend",
                                    function keyboardTransEnd() {
                                        wordRevealAC = GG.theNotch
                                            .animate(A.turnTheNotchP, {
                                                duration: 1500,
                                                ...A.EF,
                                            })
                                            .finished.then(() => {
                                                GG.wordCover.animate(
                                                    [
                                                        {
                                                            right: "100%",
                                                        },
                                                        {
                                                            right: "-10%",
                                                            offset: 0.8,
                                                        },
                                                        {
                                                            right: "0%",
                                                        },
                                                    ].reverse(),
                                                    {
                                                        duration: 1500,
                                                        ...A.EF,
                                                    }
                                                );
                                            });

                                        removeEl(
                                            keyboard,
                                            "transitionend",
                                            keyboardTransEnd
                                        );
                                    }
                                );
                            });
                        }
                    });
                }, 1000);

                gameWon = true;
            }

            return gameWon;
        })();

        //  game lost
        const gameLost = (() => {
            let gameLost = false;

            if (
                !hasEmptySlots &&
                !invalidGuess &&
                !gameWon &&
                activeRowCounter + 1 === guessWord.length
            ) {
                setTimeout(() => {
                    removeEl(keyboard, "click", keyboardMechanics);
                    removeClass(keyboard, "show-keyboard");

                    addEl(
                        keyboard,
                        "transitionend",
                        function keyboardTranEnd() {
                            const downArrowAnime = M.downArrow.animate(
                                A.scalingDownArrowP,
                                A.scalingDownArrowTF
                            );

                            addEl(M.downArrow, "click", () => {
                                downArrowAnime.cancel();
                            });

                            removeEl(
                                keyboard,
                                "transitionend",
                                keyboardTranEnd
                            );
                        }
                    );
                }, 3000);

                gameLost = true;
            }

            return gameLost;
        })();

        // next guess
        const nextGuess = (() => {
            if (
                !hasEmptySlots &&
                !invalidGuess &&
                !gameLost &&
                !gameWon &&
                activeRowCounter < GG.guessRows.length - 1
            ) {
                activeRowCounter++;

                sessionStorage.setItem(
                    "progress",
                    JSON.stringify({
                        word: GG.guessWord,
                        GWL: GG.guessWordLength,
                        guesses: [...playersGuessTracker],
                        activeRowCounter,
                        legend: M.legendText,
                    })
                );

                GG.rowActiveState(GG.guessRows[activeRowCounter], "active");
            }
        })();
    }
}

// --------------- functions ---------------
// accent shifter
export function accentShifter(command) {
    if (command === "shift" && !shiftKeyPress) {
        addClass(shiftKeyIcon, "shift-key-pressed");

        for (const key of accentedKeys) {
            key.children[0].style.display = "none";
            key.children[1].style.display = "inline";
        }

        shiftKeyPress = true;
    } else if (command === "shift" && shiftKeyPress) {
        removeClass(shiftKeyIcon, "shift-key-pressed");

        for (const key of accentedKeys) {
            key.children[0].style.display = "inline";
            key.children[1].style.display = "none";
        }

        shiftKeyPress = false;
    } else if (command === "unshift") {
        removeClass(shiftKeyIcon, "shift-key-pressed");

        for (const key of accentedKeys) {
            key.children[0].style.display = "inline";
            key.children[1].style.display = "none";
        }

        shiftKeyPress = false;
    }
}

// change active slot
function changeActiveSlot(activate, empty) {
    for (const slot of GG.activeRowSlots) {
        if (slot.classList.contains("active-slot")) {
            deactivateSlots();

            if (empty) slot.innerText = "";
        }
    }

    addClass(GG.activeRowSlots[activate], "active-slot");
}

// deactivate slots
export function deactivateSlots() {
    for (const slot of GG.activeRowSlots) removeClass(slot, "active-slot");
}

// previous row
export function previousActiveSlot() {
    let previousActiveSlot;

    GG.activeRowSlots.forEach((slot, index, array) => {
        if (slot.classList.contains("active-slot")) {
            previousActiveSlot = index === 0 ? index : index - 1;
        }
    });

    return previousActiveSlot;
}

// next row
export function nextActiveSlot(loop) {
    let nextActiveSlot;

    GG.activeRowSlots.forEach((slot, index, array) => {
        if (slot.classList.contains("active-slot") && !loop) {
            nextActiveSlot = index === array.length - 1 ? index : index + 1;
        } else if (slot.classList.contains("active-slot") && loop === "loop") {
            nextActiveSlot = index === array.length - 1 ? 0 : index + 1;
        }
    });

    return nextActiveSlot;
}

// clear invalid guess
export function clearInvalidGuess() {
    GG.activeRowSlots.reverse().forEach((slot, index) => {
        slot.innerText = "";
    });

    GG.activeRowSlots.reverse();
    changeActiveSlot(0);
}

function unregisteredPopUp(PG) {
    unregistered.lastElementChild.innerText = `${PG.join("")}`;

    addClass(unregistered, "show-unregistered");

    addEl(unregistered, "transitionend", function unregAnimeEnd(e) {
        setTimeout(() => {
            removeClass(unregistered, "show-unregistered");
        }, 3000);

        removeEl(unregistered, "transitionend", unregAnimeEnd);
    });
}

// dupllicate removal
export function duplicateRemover(rows, letter, index, className) {
    if (activeRowCounter > 0) {
        rows.forEach((row, rowIndex) => {
            const rowSlots = Array.from(row.children).reverse();

            rowSlots.forEach((slot, slotIndex) => {
                const slotletter =
                    slot.innerText === "هـ" ? "ه" : slot.innerText;

                if (
                    rowIndex !== rows.length - 1 &&
                    slotletter === letter &&
                    slotIndex === index &&
                    slot.classList.contains(className)
                ) {
                    slot.animate(A.SlotNotIncludedP, A.SlotNotIncludedTF);
                    removeClass(slot, className);
                }
            });
        });
    }
}

export function gameReset() {
    activeRowCounter = 0;
    playersGuessTracker = [];
    GG.word.innerText = "Your Guess";
    GG.word.style.opacity = 0;

    removeClass(M.legend, "show-legend");

    for (const key of keys) {
        removeClass(key, "key-not-included");
        removeClass(key, "incorrect-key");
        removeClass(key, "correct-key");

        key.animate(
            {
                backgroundColor: "rgba(120,120,120, 0.02)",
                color: "white",
            },
            {
                duration: 0,
                fill: "both",
            }
        );
    }

    removeClass(keyboard, "show-keyboard");
    removeClass(shiftKeyIcon, "shift-key-pressed");

    if (GG.veilWordAC) {
        GG.veilWordAC.cancel();
    }
}

// --------------- imports ---------------
import {
    log,
    query,
    queryAll,
    addClass,
    removeClass,
    addEl,
    removeEl,
    A,
    DB,
    M,
    GG,
    K,
} from "./aggregator.js";
