import React, { useState, useEffect } from 'react'
import * as R from 'ramda'
import classnames from 'classnames'
import { Formik, Field as FormikField } from 'formik'
import { makeStyles } from '@material-ui/core'

import { H1, Info2, H4 } from 'src/components/typography'
import { Button } from 'src/components/buttons'
import Stage from 'src/components/Stage'
import { startCase } from 'src/utils/string'
import { RadioGroup, AutocompleteSelect } from 'src/components/inputs'

import { getBitgoFields, getBitgoFormik } from '../Services/Bitgo'
import { getBitstampFields, getBitstampFormik } from '../Services/Bitstamp'
import {
  getBlockcypherFields,
  getBlockcypherFormik
} from '../Services/Blockcypher'
import { getInfuraFields, getInfuraFormik } from '../Services/Infura'
import { getKrakenFields, getKrakenFormik } from '../Services/Kraken'
import { getStrikeFields, getStrikeFormik } from '../Services/Strike'

const styles = {
  modalContent: {
    display: 'flex',
    flexDirection: 'column',
    padding: [[24, 32]],
    '& > h1': {
      margin: [[0, 0, 12]]
    },
    '& > h4': {
      margin: [[32, 0]]
    },
    '& > p': {
      margin: 0
    }
  },
  submitButton: {
    alignSelf: 'flex-end',
    width: 67,
    padding: [[0, 0]],
    margin: [['auto', 0, 0]],
    '&:active': {
      margin: [['auto', 0, 0]]
    }
  },
  stages: {
    marginBottom: 0
  },
  radios: {
    display: 'flex'
  },
  radiosAsColumn: {
    flexDirection: 'column'
  },
  radiosAsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  alreadySetupRadioButtons: {
    display: 'flex',
    flexDirection: 'row'
  },
  selectNewWrapper: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0
  },
  selectNew: {
    width: 204,
    flexGrow: 0,
    bottom: 7
  },
  newServiceForm: {
    display: 'flex',
    flexDirection: 'column'
  },
  newServiceFormFields: {
    marginBottom: 48
  },
  formInput: {
    '& .MuiInputBase-input': {
      width: 426
    }
  }
}

const getNewServiceForm = serviceName => {
  switch (serviceName) {
    case 'bitgo':
      return { fields: getBitgoFields(), formik: getBitgoFormik() }
    case 'bitstamp':
      return { fields: getBitstampFields(), formik: getBitstampFormik() }
    case 'blockcypher':
      return { fields: getBlockcypherFields(), formik: getBlockcypherFormik() }
    case 'infura':
      return { fields: getInfuraFields(), formik: getInfuraFormik() }
    case 'kraken':
      return { fields: getKrakenFields(), formik: getKrakenFormik() }
    case 'strike':
      return { fields: getStrikeFields(), formik: getStrikeFormik() }
    default:
  }
}

const useStyles = makeStyles(styles)

const WizardPage02 = ({
  crypto,
  coinName,
  pageName,
  currentStage,
  alreadySetUp,
  notSetUp,
  handleModalNavigation,
  saveNewService
}) => {
  const [selectedRadio, setSelectedRadio] = useState(
    crypto[pageName] !== '' ? crypto[pageName] : null
  )
  useEffect(
    () => setSelectedRadio(crypto[pageName] !== '' ? crypto[pageName] : null),
    [crypto, pageName]
  )
  const [setUpNew, setSetUpNew] = useState(null)
  const [selectedFromDropdown, setSelectedFromDropdown] = useState(null)
  const [formContent, setFormContent] = useState(null)

  const classes = useStyles()

  const radiosClassNames = {
    [classes.radios]: true,
    [classes.radiosAsColumn]: !selectedFromDropdown,
    [classes.radiosAsRow]: selectedFromDropdown
  }

  const radioButtonOptions =
    alreadySetUp &&
    R.map(el => {
      return { label: el.display, value: el.code }
    })(alreadySetUp)

  const handleRadioButtons = event => {
    R.o(setSelectedRadio, R.path(['target', 'value']))(event)
    setSetUpNew('')
    setFormContent(null)
    setSelectedFromDropdown(null)
  }

  const handleSetUpNew = event => {
    R.o(setSetUpNew, R.path(['target', 'value']))(event)
    setSelectedRadio('')
    setFormContent(null)
    setSelectedFromDropdown(null)
  }

  const handleNext = value => event => {
    handleModalNavigation(R.mergeDeepRight(crypto, { [pageName]: value }))(
      currentStage + 1
    )
    setSelectedRadio(null)
    setFormContent(null)
    setSelectedFromDropdown(null)
    setSetUpNew('')
  }

  const handleSelectFromDropdown = it => {
    setSelectedFromDropdown(it)
    setFormContent(getNewServiceForm(it?.code))
  }

  const isSubmittable = () => {
    if (selectedRadio) return true
    if (!selectedRadio && selectedFromDropdown && !formContent) return true
    return false
  }

  return (
    <div className={classes.modalContent}>
      <H1>Enable {coinName}</H1>
      <Info2>{startCase(pageName)}</Info2>
      <Stage
        stages={4}
        currentStage={currentStage}
        color="spring"
        className={classes.stages}
      />
      <H4>{`Select a ${R.toLower(
        startCase(pageName)
      )} or set up a new one`}</H4>
      <div className={classnames(radiosClassNames)}>
        {alreadySetUp && (
          <RadioGroup
            name="already-setup-select"
            value={selectedRadio || radioButtonOptions[0]}
            options={radioButtonOptions}
            ariaLabel="already-setup-select"
            onChange={handleRadioButtons}
            className={classes.alreadySetupRadioButtons}
          />
        )}
        {notSetUp && (
          <div className={classes.selectNewWrapper}>
            <RadioGroup
              name="setup-new-select"
              value={setUpNew || ''}
              options={[{ label: 'Set up new', value: 'new' }]}
              ariaLabel="setup-new-select"
              onChange={handleSetUpNew}
              className={classes.alreadySetupRadioButtons}
            />
            {setUpNew && (
              <AutocompleteSelect
                id="chooseNew"
                name="chooseNew"
                label={`Select ${pageName}`}
                suggestions={notSetUp}
                value={selectedFromDropdown}
                handleChange={handleSelectFromDropdown}
                className={classes.selectNew}
              />
            )}
          </div>
        )}
      </div>
      {formContent && (
        <Formik
          initialValues={formContent.formik.initialValues}
          validationSchema={formContent.formik.validationSchema}
          onSubmit={values =>
            saveNewService(selectedFromDropdown.code, values)
              .then(m => {
                handleNext(selectedFromDropdown.code)()
              })
              .catch(e => console.error(e))
          }>
          {props => (
            <form
              onReset={props.handleReset}
              onSubmit={props.handleSubmit}
              className={classes.newServiceForm}>
              <div className={classes.newServiceFormFields}>
                {formContent.fields.map((field, idx) => (
                  <div key={idx} className={classes.field}>
                    <FormikField
                      id={field.name}
                      name={field.name}
                      component={field.component}
                      placeholder={field.placeholder}
                      type={field.type}
                      label={field.label}
                      className={classes.formInput}
                      onFocus={() => {
                        // setError(null)
                      }}
                    />
                  </div>
                ))}
              </div>
              <Button
                disabled={R.isEmpty(props.touched) || !props.isValid}
                className={classes.submitButton}
                type="submit">
                Next
              </Button>
            </form>
          )}
        </Formik>
      )}
      {!formContent && (
        <Button
          className={classes.submitButton}
          disabled={!isSubmittable()}
          onClick={handleNext(selectedRadio || selectedFromDropdown?.code)}>
          Next
        </Button>
      )}
    </div>
  )
}

export default WizardPage02
